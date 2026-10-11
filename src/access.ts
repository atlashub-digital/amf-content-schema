import { z } from "zod";

export const AccessModeSchema = z.enum([
  "public",
  "free-account",
  "lead-gate",
  "one-time",
  "bundle",
  "pack",
  "membership",
  "subscription",
  "campaign-reward",
  "manual-grant",
]);

export const AccessPolicySchema = z.object({
  mode: AccessModeSchema,
  requiresAuth: z.boolean().optional(),
  productRefs: z.array(z.string().min(1)).optional(),
  planRefs: z.array(z.string().min(1)).optional(),
  campaignRefs: z.array(z.string().min(1)).optional(),
  entitlementRefs: z.array(z.string().min(1)).optional(),
  preview: z
    .object({
      enabled: z.boolean(),
      chapterLimit: z.number().int().nonnegative().optional(),
      percentage: z.number().min(0).max(100).optional(),
    })
    .optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
});

export type AccessMode = z.infer<typeof AccessModeSchema>;
export type AccessPolicy = z.infer<typeof AccessPolicySchema>;
