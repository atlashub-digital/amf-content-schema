import { z } from "zod";

const BlockId = z.string().min(1).optional();
export const ParagraphBlockSchema = z.object({
  type: z.literal("paragraph"), id: BlockId, text: z.string().min(1),
}).strict();
export const HeadingBlockSchema = z.object({
  type: z.literal("heading"), id: BlockId, text: z.string().min(1),
  level: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2),
}).strict();
export const CalloutBlockSchema = z.object({
  type: z.literal("callout"), id: BlockId, title: z.string().min(1).optional(),
  text: z.string().min(1),
  tone: z.enum(["note", "tip", "warning"]).default("note"),
}).strict();

export const ContentBlockSchema = z.discriminatedUnion("type", [
  ParagraphBlockSchema, HeadingBlockSchema, CalloutBlockSchema,
]);
export type ContentBlock = z.infer<typeof ContentBlockSchema>;

// Legacy BodySourceSchema remains unchanged. New publications opt in with v0.2.
export const CanonicalBodySourceSchema = z.discriminatedUnion("format", [
  z.object({ format: z.literal("markdown-inline"), markdown: z.string().min(1) }),
  z.object({ format: z.literal("markdown-path"), path: z.string().min(1) }),
  z.object({ format: z.literal("json-path"), path: z.string().min(1) }),
  z.object({
    format: z.literal("blocks"), blocks: z.array(ContentBlockSchema).min(1),
  }).superRefine((body, ctx) => {
    const seen = new Set<string>();
    body.blocks.forEach((block, index) => {
      if (!block.id) return;
      if (seen.has(block.id)) ctx.addIssue({
        code: "custom", path: ["blocks", index, "id"], message: "Duplicate block id.",
      });
      seen.add(block.id);
    });
  }),
]);
export type CanonicalBodySource = z.infer<typeof CanonicalBodySourceSchema>;
