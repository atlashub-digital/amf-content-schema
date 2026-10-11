import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PublicationSchema } from "../src/index.js";

async function fixture(path: string) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("AtlasHub Editions fixture validates", async () => {
  const parsed = PublicationSchema.parse(await fixture("examples/editions-publication.json"));
  assert.equal(parsed.type, "book");
  assert.equal(parsed.access.mode, "public");
});

test("MyPets fixture validates", async () => {
  const parsed = PublicationSchema.parse(await fixture("examples/mypets-guide.json"));
  assert.equal(parsed.type, "guide");
  assert.equal(parsed.access.mode, "campaign-reward");
});

test("publication without body or chapters is rejected", () => {
  const result = PublicationSchema.safeParse({
    schemaVersion: "0.1",
    id: "invalid",
    slug: "invalid",
    type: "guide",
    status: "draft",
    locale: "pt-BR",
    title: "Invalid",
    access: { mode: "public" }
  });
  assert.equal(result.success, false);
});
