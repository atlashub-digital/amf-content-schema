import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  BodySourceSchema, CanonicalBodySourceSchema, CanonicalPublicationSchema,
  CheckInSchema, ContentBlockSchema, ContentManifestSchema, ProgramSchema,
  PublicationSchema, findManifestProgram, listManifestPrograms,
} from "../src/index.js";

async function fixture(name: string) {
  return JSON.parse(await readFile("examples/" + name, "utf8"));
}

test("canonical Article and Guide validate", async () => {
  for (const name of ["article.json", "guide.json"]) {
    const raw = await fixture(name);
    assert.equal(CanonicalPublicationSchema.parse(raw).schemaVersion, "0.2");
    assert.equal(PublicationSchema.parse(raw).type, raw.type);
  }
});

test("seven-day Journey validates and resolves its publications", async () => {
  const manifest = ContentManifestSchema.parse(await fixture("content-manifest.json"));
  const program = findManifestProgram(manifest, "sample-journey")!;
  assert.equal(program.units.length, 7);
  assert.equal(program.durationDays, 7);
  assert.equal(findManifestProgram(manifest, program.slug)?.id, program.id);
  assert.equal(findManifestProgram(manifest, "missing"), null);
  assert.equal(listManifestPrograms(manifest).length, 1);
  assert.equal(program.units.every(unit => unit.missions.length && unit.reflections.length && unit.checkIns.length), true);
  const publications = new Set(manifest.publications.map(p => p.id));
  assert.equal(program.units.every(unit => unit.publicationRefs.every(ref => publications.has(ref))), true);
});

test("legacy body formats, free-form blocks and program Publication remain valid", async () => {
  const guide = await fixture("mypets-guide.json");
  const editions = await fixture("editions-publication.json");
  assert.equal(PublicationSchema.safeParse(guide).success, true);
  assert.equal(PublicationSchema.safeParse(editions).success, true);
  assert.equal(PublicationSchema.safeParse({ ...guide, type: "program" }).success, true);
  const blocks = { format: "blocks", blocks: [{ custom: "legacy" }] };
  assert.equal(BodySourceSchema.safeParse(blocks).success, true);
  assert.equal(CanonicalBodySourceSchema.safeParse(blocks).success, false);
  const manifest = ContentManifestSchema.parse({
    schemaVersion: "0.1", project: "legacy", publications: [guide],
  });
  assert.equal(listManifestPrograms(manifest).length, 0);
  assert.equal(findManifestProgram(manifest, "missing"), null);
  assert.equal("programs" in manifest, false);
});

test("canonical block discriminants reject incomplete or unknown blocks", () => {
  for (const raw of [
    { type: "paragraph" }, { type: "heading", text: "Title", level: 1 },
    { type: "callout", title: "Empty" }, { type: "html", html: "<script/>" },
  ]) assert.equal(ContentBlockSchema.safeParse(raw).success, false);
  assert.equal(CanonicalBodySourceSchema.safeParse({ format: "blocks", blocks: [] }).success, false);
});

test("canonical publications reject duplicate chapter ids, slugs, orders and blocks", async () => {
  const guide = await fixture("guide.json");
  for (const field of ["id", "slug", "order"]) {
    const raw = structuredClone(guide);
    raw.chapters[1][field] = raw.chapters[0][field];
    assert.equal(CanonicalPublicationSchema.safeParse(raw).success, false, field);
  }
  const article = await fixture("article.json");
  article.body.blocks[1].id = article.body.blocks[0].id;
  assert.equal(CanonicalPublicationSchema.safeParse(article).success, false);
});

test("canonical manifest rejects missing publication references", async () => {
  for (const ref of ["missing-publication", "everyday-observation"]) {
    const raw = await fixture("content-manifest.json");
    raw.programs[0].units[0].publicationRefs = [ref];
    assert.equal(ContentManifestSchema.safeParse(raw).success, false);
  }
  const raw = await fixture("content-manifest.json");
  raw.collections = [{ schemaVersion: "0.1", id: "collection", slug: "collection", title: "Collection", publicationRefs: ["missing"] }];
  assert.equal(ContentManifestSchema.safeParse(raw).success, false);
});

test("canonical manifest rejects duplicate ids, slugs and ambiguous lookups", async () => {
  for (const kind of ["publications", "programs", "collections"]) {
    const raw = await fixture("content-manifest.json");
    if (kind === "collections") raw.collections = [{ schemaVersion: "0.1", id: "c", slug: "c", title: "Collection", publicationRefs: ["sample-guide"] }];
    raw[kind].push(structuredClone(raw[kind][0]));
    assert.equal(ContentManifestSchema.safeParse(raw).success, false, kind);
  }
  const raw = await fixture("content-manifest.json");
  raw.publications[1].slug = raw.publications[0].id;
  assert.equal(ContentManifestSchema.safeParse(raw).success, false);
});

test("Program rejects duplicate unit ids, order, day numbers and activity ids", async () => {
  for (const field of ["id", "order", "day"]) {
    const raw = await fixture("journey-seven-days.json");
    raw.units[1][field] = raw.units[0][field];
    assert.equal(ProgramSchema.safeParse(raw).success, false, field);
  }
  for (const kind of ["missions", "reflections", "checkIns"]) {
    const raw = await fixture("journey-seven-days.json");
    raw.units[1][kind][0].id = raw.units[0][kind][0].id;
    assert.equal(ProgramSchema.safeParse(raw).success, false, kind);
  }
  const raw = await fixture("journey-seven-days.json");
  raw.units[0].reflections[0].id = raw.units[0].missions[0].id;
  assert.equal(ProgramSchema.safeParse(raw).success, false);
});

test("Program rejects missing days, empty units and incomplete activities", async () => {
  const missingDay = await fixture("journey-seven-days.json");
  missingDay.units.pop();
  assert.equal(ProgramSchema.safeParse(missingDay).success, false);
  for (const field of ["access", "title", "units"]) {
    const raw = await fixture("journey-seven-days.json"); delete raw[field];
    assert.equal(ProgramSchema.safeParse(raw).success, false, field);
  }
  for (const [kind, field] of [["missions", "instructions"], ["reflections", "prompt"], ["checkIns", "prompt"]]) {
    const raw = await fixture("journey-seven-days.json"); delete raw.units[0][kind][0][field];
    assert.equal(ProgramSchema.safeParse(raw).success, false, kind);
  }
  const raw = await fixture("journey-seven-days.json");
  raw.units[0] = { id: "empty", kind: "day", day: 1, order: 0, title: "Empty" };
  assert.equal(ProgramSchema.safeParse(raw).success, false);
});

test("Program supports modules with stable order independently of calendar duration", () => {
  assert.equal(ProgramSchema.safeParse({
    schemaVersion: "0.2", id: "modules", slug: "modules", kind: "program",
    status: "preview", locale: "en", title: "Modules", access: { mode: "public" },
    units: [{ id: "module-intro", kind: "module", order: 10, title: "Introduction", publicationRefs: ["sample-article"] }],
  }).success, true);
});

test("check-in templates reject answers, invalid scales and duplicate option ids", () => {
  for (const raw of [
    { id: "check", kind: "text", prompt: "Prompt", answer: "Private response" },
    { id: "check", kind: "scale", prompt: "Prompt", min: 10, max: 1 },
    { id: "check", kind: "choice", prompt: "Prompt", options: [{ id: "a", label: "A" }, { id: "a", label: "B" }] },
  ]) assert.equal(CheckInSchema.safeParse(raw).success, false);
});

test("canonical contracts reject commerce/provider/member fields", async () => {
  for (const field of ["price", "paymentProvider", "memberId", "answers"]) {
    const program = await fixture("journey-seven-days.json");
    program[field] = "not-editorial";
    assert.equal(ProgramSchema.safeParse(program).success, false, field);
    const article = await fixture("article.json");
    article[field] = "not-editorial";
    assert.equal(CanonicalPublicationSchema.safeParse(article).success, false, field);
  }
});

test("canonical media references must resolve within the Publication", async () => {
  const raw = await fixture("guide.json");
  raw.chapters[0].mediaPlacements = [{ id: "missing", mediaId: "missing", anchor: "guide-start", position: "before" }];
  assert.equal(CanonicalPublicationSchema.safeParse(raw).success, false);
});

test("days follow ordering and identifiers cannot be empty or positional display text", async () => {
  const reversed = await fixture("journey-seven-days.json");
  reversed.units[0].order = 6; reversed.units[6].order = 0;
  assert.equal(ProgramSchema.safeParse(reversed).success, false);
  const raw = await fixture("journey-seven-days.json");
  raw.units[0].missions[0].id = "unstable display text";
  assert.equal(ProgramSchema.safeParse(raw).success, false);
});

test("text and scale check-ins carry prompts only", () => {
  assert.equal(CheckInSchema.safeParse({ id: "text", kind: "text", prompt: "One observation?" }).success, true);
  assert.equal(CheckInSchema.safeParse({ id: "scale", kind: "scale", prompt: "How was this step?", min: 0, max: 5 }).success, true);
});
