import { z } from "zod";
import { CollectionSchema } from "./collection.js";
import { PublicationSchema } from "./publication.js";
import { ProgramSchema } from "./program.js";
import { uniqueValues } from "./validation.js";

const ManifestFields = {
  project: z.string().min(1),
  generatedAt: z.string().optional(),
  publications: z.array(PublicationSchema),
  collections: z.array(CollectionSchema).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
};
// The v0.1 input contract remains permissive and its old fields are unchanged.
export const LegacyContentManifestSchema = z.object({
  schemaVersion: z.literal("0.1"), ...ManifestFields,
});
export const CanonicalContentManifestSchema = z.object({
  schemaVersion: z.literal("0.2"), ...ManifestFields,
  programs: z.array(ProgramSchema).default([]),
}).strict().superRefine((manifest, ctx) => {
  for (const [name, items] of [
    ["publications", manifest.publications],
    ["programs", manifest.programs],
    ["collections", manifest.collections],
  ] as const) {
    uniqueValues(items.map(item => item.id), ctx, [name], name + " id");
    uniqueValues(items.map(item => item.slug), ctx, [name], name + " slug");
    const lookup = new Map<string, string>();
    items.forEach((item, index) => {
      for (const key of [item.id, item.slug]) {
        const previous = lookup.get(key);
        if (previous !== undefined && previous !== item.id) ctx.addIssue({
          code: "custom", path: [name, index], message: "Ambiguous id/slug lookup.",
        });
        lookup.set(key, item.id);
      }
    });
  }
  const publicationIds = new Set(manifest.publications.map(p => p.id));
  manifest.programs.forEach((program, index) => {
    program.units.forEach((unit, unitIndex) => {
      unit.publicationRefs.forEach((ref, refIndex) => {
        if (!publicationIds.has(ref)) ctx.addIssue({
          code: "custom", path: ["programs", index, "units", unitIndex, "publicationRefs", refIndex],
          message: "Unknown Publication id: " + ref,
        });
      });
    });
  });
  manifest.collections.forEach((collection, index) => {
    uniqueValues(collection.publicationRefs, ctx, ["collections", index, "publicationRefs"], "collection reference");
    collection.publicationRefs.forEach((ref, refIndex) => {
      if (!publicationIds.has(ref)) ctx.addIssue({
        code: "custom", path: ["collections", index, "publicationRefs", refIndex],
        message: "Unknown Publication id: " + ref,
      });
    });
  });
});

export const ContentManifestSchema = z.union([
  LegacyContentManifestSchema, CanonicalContentManifestSchema,
]);
export type ContentManifest = z.infer<typeof ContentManifestSchema>;

export function listManifestPrograms(manifest: ContentManifest): Program[] {
  return manifest.schemaVersion === "0.2" ? [...manifest.programs] : [];
}
export function findManifestProgram(manifest: ContentManifest, ref: string): Program | null {
  return listManifestPrograms(manifest).find(program => program.id === ref || program.slug === ref) ?? null;
}
