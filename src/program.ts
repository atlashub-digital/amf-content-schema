import { z } from "zod";
import { AccessPolicySchema } from "./access.js";
import { StableIdSchema, uniqueValues } from "./validation.js";

export const MissionSchema = z.object({
  id: StableIdSchema, title: z.string().min(1), instructions: z.string().min(1),
  required: z.boolean().default(true),
}).strict();

export const ReflectionSchema = z.object({
  id: StableIdSchema, prompt: z.string().min(1),
  required: z.boolean().default(false),
}).strict();

// Editorial prompts only. Member answers and identities live in runtime adapters.
export const CheckInSchema = z.discriminatedUnion("kind", [
  z.object({
    id: StableIdSchema, kind: z.literal("text"), prompt: z.string().min(1),
    required: z.boolean().default(false),
  }).strict(),
  z.object({
    id: StableIdSchema, kind: z.literal("scale"), prompt: z.string().min(1),
    required: z.boolean().default(false), min: z.number().finite(), max: z.number().finite(),
  }).strict().refine(value => value.min < value.max, {
    path: ["max"], message: "Scale maximum must exceed minimum.",
  }),
  z.object({
    id: StableIdSchema, kind: z.literal("choice"), prompt: z.string().min(1),
    required: z.boolean().default(false),
    options: z.array(z.object({ id: StableIdSchema, label: z.string().min(1) }).strict()).min(2),
  }).strict().superRefine((value, ctx) => {
    uniqueValues(value.options.map(option => option.id), ctx, ["options"], "choice id");
  }),
]);

const UnitFields = {
  id: StableIdSchema, title: z.string().min(1), order: z.number().int().nonnegative(),
  publicationRefs: z.array(StableIdSchema).default([]),
  missions: z.array(MissionSchema).default([]),
  reflections: z.array(ReflectionSchema).default([]),
  checkIns: z.array(CheckInSchema).default([]),
};
export const ProgramUnitSchema = z.discriminatedUnion("kind", [
  z.object({ ...UnitFields, kind: z.literal("day"), day: z.number().int().positive() }).strict(),
  z.object({ ...UnitFields, kind: z.literal("module") }).strict(),
]).superRefine((unit, ctx) => {
  if (unit.publicationRefs.length + unit.missions.length + unit.reflections.length + unit.checkIns.length === 0) {
    ctx.addIssue({ code: "custom", path: ["publicationRefs"], message: "A unit requires content or an activity." });
  }
  uniqueValues(unit.publicationRefs, ctx, ["publicationRefs"], "publication reference");
});

export const ProgramSchema = z.object({
  schemaVersion: z.literal("0.2"), id: StableIdSchema, slug: StableIdSchema,
  kind: z.enum(["program", "journey"]),
  status: z.enum(["draft", "preview", "published", "archived"]),
  locale: z.string().min(2), title: z.string().min(1),
  description: z.string().optional(), authors: z.array(z.string().min(1)).default([]),
  durationDays: z.number().int().positive().optional(),
  units: z.array(ProgramUnitSchema).min(1),
  access: AccessPolicySchema,
}).strict().superRefine((program, ctx) => {
  uniqueValues(program.units.map(unit => unit.id), ctx, ["units"], "unit id");
  uniqueValues(program.units.map(unit => unit.order), ctx, ["units"], "unit order");
  const days = program.units.filter(unit => unit.kind === "day");
  uniqueValues(days.map(unit => unit.day), ctx, ["units"], "day number");
  const orderedDays = [...days].sort((a, b) => a.order - b.order);
  if (orderedDays.some((day, index) => index > 0 && day.day <= orderedDays[index - 1].day)) {
    ctx.addIssue({ code: "custom", path: ["units"], message: "Day numbering must follow unit order." });
  }
  if (program.durationDays !== undefined &&
      (days.length !== program.durationDays || days.some(day => day.day > program.durationDays!))) {
    ctx.addIssue({ code: "custom", path: ["durationDays"], message: "Declared duration requires every day from 1 through durationDays." });
  }
  // Activity ids form one namespace per Program, independent of order/title.
  const activities = program.units.flatMap(unit => [...unit.missions, ...unit.reflections, ...unit.checkIns]);
  uniqueValues(activities.map(activity => activity.id), ctx, ["units"], "activity id");
});

export type Program = z.infer<typeof ProgramSchema>;
export type ProgramUnit = z.infer<typeof ProgramUnitSchema>;
export type Mission = z.infer<typeof MissionSchema>;
export type Reflection = z.infer<typeof ReflectionSchema>;
export type CheckIn = z.infer<typeof CheckInSchema>;
