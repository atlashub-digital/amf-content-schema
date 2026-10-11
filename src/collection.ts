import { z } from "zod";

export const CollectionSchema = z.object({
  schemaVersion: z.literal("0.1"),
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  publicationRefs: z.array(z.string().min(1)),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Collection = z.infer<typeof CollectionSchema>;
