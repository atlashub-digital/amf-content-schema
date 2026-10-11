import { z } from "zod";
import { CollectionSchema } from "./collection.js";
import { PublicationSchema } from "./publication.js";

export const ContentManifestSchema = z.object({
  schemaVersion: z.literal("0.1"),
  project: z.string().min(1),
  generatedAt: z.string().optional(),
  publications: z.array(PublicationSchema),
  collections: z.array(CollectionSchema).default([]),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type ContentManifest = z.infer<typeof ContentManifestSchema>;
