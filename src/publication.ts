import { z } from "zod";
import { AccessPolicySchema } from "./access.js";
import { MediaAssetSchema, MediaPlacementSchema } from "./media.js";

export const PublicationTypeSchema = z.enum([
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

export const PublicationSchema = z.object({
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
}).superRefine((publication, ctx) => {
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
