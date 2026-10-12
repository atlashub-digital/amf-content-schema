import { z } from "zod";
import { CanonicalBodySourceSchema } from "./blocks.js";
import { StableIdSchema, uniqueValues } from "./validation.js";
import { AccessPolicySchema } from "./access.js";
import { MediaAssetSchema, MediaPlacementSchema } from "./media.js";

export const PublicationTypeSchema = z.enum([
  "article",
  "book",
  "ebook",
  "guide",
  "paper",
  "research",
  "essay",
  "course",
  "program",
  "manual",
  "playbook",
]);

export const PublicationStatusSchema = z.enum([
  "draft",
  "preview",
  "published",
  "archived",
]);

export const BodySourceSchema = z.discriminatedUnion("format", [
  z.object({
    format: z.literal("markdown-inline"),
    markdown: z.string(),
  }),
  z.object({
    format: z.literal("markdown-path"),
    path: z.string().min(1),
  }),
  z.object({
    format: z.literal("json-path"),
    path: z.string().min(1),
  }),
  z.object({
    format: z.literal("blocks"),
    blocks: z.array(z.record(z.string(), z.unknown())),
  }),
]);

export const ChapterSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  order: z.number().int().nonnegative(),
  number: z.string().optional(),
  part: z.string().optional(),
  summary: z.string().optional(),
  body: BodySourceSchema.optional(),
  mediaPlacements: z.array(MediaPlacementSchema).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

const PublicationObjectSchema = z.object({
  schemaVersion: z.literal("0.1"),
  id: z.string().min(1),
  slug: z.string().min(1),
  type: PublicationTypeSchema,
  status: PublicationStatusSchema,
  locale: z.string().min(2),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  authors: z.array(z.string().min(1)).default([]),
  edition: z.string().optional(),
  publishedAt: z.string().optional(),
  cover: z.string().optional(),
  tags: z.array(z.string()).default([]),
  readingMinutes: z.number().int().positive().optional(),
  body: BodySourceSchema.optional(),
  chapters: z.array(ChapterSchema).default([]),
  media: z.array(MediaAssetSchema).default([]),
  access: AccessPolicySchema,
  source: z
    .object({
      repository: z.string().optional(),
      ref: z.string().optional(),
      path: z.string().optional(),
    })
    .optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
});

export const LegacyPublicationSchema = PublicationObjectSchema.superRefine((publication, ctx) => {
  if (!publication.body && publication.chapters.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "A publication requires either body or at least one chapter.",
      path: ["body"],
    });
  }
});

export type Publication = z.infer<typeof PublicationSchema>;
export type Chapter = z.infer<typeof ChapterSchema>;
export type BodySource = z.infer<typeof BodySourceSchema>;

export const CanonicalChapterSchema = ChapterSchema.extend({
  id: StableIdSchema, body: CanonicalBodySourceSchema,
}).strict();

export const CanonicalPublicationSchema = PublicationObjectSchema.extend({
  schemaVersion: z.literal("0.2"),
  id: StableIdSchema,
  body: CanonicalBodySourceSchema.optional(),
  chapters: z.array(CanonicalChapterSchema).default([]),
}).strict().superRefine((publication, ctx) => {
  if (!publication.body && publication.chapters.length === 0) {
    ctx.addIssue({ code: "custom", path: ["body"], message: "A publication requires content." });
  }
  uniqueValues(publication.chapters.map(c => c.id), ctx, ["chapters"], "chapter id");
  uniqueValues(publication.chapters.map(c => c.slug), ctx, ["chapters"], "chapter slug");
  uniqueValues(publication.chapters.map(c => c.order), ctx, ["chapters"], "chapter order");
  uniqueValues(publication.media.map(m => m.id), ctx, ["media"], "media id");
  const mediaIds = new Set(publication.media.map(m => m.id));
  publication.chapters.forEach((chapter, index) => {
    uniqueValues((chapter.mediaPlacements ?? []).map(p => p.id), ctx, ["chapters", index, "mediaPlacements"], "placement id");
    (chapter.mediaPlacements ?? []).forEach((placement, placementIndex) => {
      if (!mediaIds.has(placement.mediaId)) ctx.addIssue({
        code: "custom", path: ["chapters", index, "mediaPlacements", placementIndex, "mediaId"],
        message: "Unknown media reference.",
      });
    });
  });
});

export const PublicationSchema = z.union([LegacyPublicationSchema, CanonicalPublicationSchema]);
export type CanonicalPublication = z.infer<typeof CanonicalPublicationSchema>;
