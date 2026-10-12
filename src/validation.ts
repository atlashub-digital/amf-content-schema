import { z } from "zod";

export const StableIdSchema = z.string().min(1).regex(
  /^[A-Za-z0-9][A-Za-z0-9._:-]*$/, "Use stable identifiers, not positional indexes or display text.",
);

export function uniqueValues(
  values: readonly (string | number)[], ctx: z.RefinementCtx,
  path: (string | number)[], label: string,
) {
  const seen = new Set<string | number>();
  values.forEach((value, index) => {
    if (seen.has(value)) ctx.addIssue({
      code: "custom", path: [...path, index], message: "Duplicate " + label + ".",
    });
    seen.add(value);
  });
}
