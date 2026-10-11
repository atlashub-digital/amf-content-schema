import { z } from "zod";

export const MediaAssetSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["image", "video", "audio", "document", "embed", "original-visual"]),
  title: z.string().optional(),
  alt: z.string().optional(),
  caption: z.string().optional(),
  assetPath: z.string().optional(),
  assetUrl: z.string().url().optional(),
  embedUrl: z.string().url().optional(),
  publisher: z.string().optional(),
  sourcePage: z.string().url().optional(),
  license: z.string().optional(),
  attribution: z.string().optional(),
  attributionRequired: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const MediaPlacementSchema = z.object({
  id: z.string().min(1),
  mediaId: z.string().min(1),
  anchor: z.string().min(1),
  position: z.enum(["before", "after", "inline"]),
  render: z.string().optional(),
  watchFor: z.array(z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type MediaAsset = z.infer<typeof MediaAssetSchema>;
export type MediaPlacement = z.infer<typeof MediaPlacementSchema>;
