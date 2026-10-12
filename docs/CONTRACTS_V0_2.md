# AMF Content Contracts v0.2

Status: proposed contract for human review. No auto-merge or downstream activation.

## Decision and compatibility

Package 0.2.0 adds a canonical v0.2 profile and retains the original v0.1 input
contracts. `PublicationSchema` and `ContentManifestSchema` read both versions.
`BodySourceSchema` and `ChapterSchema` retain v0.1 behavior, including free-form
blocks and the original Markdown/path formats. No legacy fixture is rewritten.
`article` is added to PublicationTypeSchema. The legacy `program` Publication
type remains readable; it is not the new Journey contract.

Rejecting formerly accepted arbitrary blocks inside v0.1 would break existing
consumers. Instead, new content selects schemaVersion 0.2 and uses the strict
canonical profile. Frameworks must explicitly distinguish the manifest versions
when accessing the new programs list. Existing manifest output has no new field.

## Publications and blocks

A v0.2 Publication has the same editorial metadata and AccessPolicy as before,
but inline content is canonical and a chapter requires a body. Body formats:
Markdown inline/path, JSON path, or a nonempty array of ContentBlockSchema.
paragraph has text; heading has text and level 2/3/4 (default 2);
callout has text, optional title and note/tip/warning tone (default note).
Block ids are optional for compatibility with existing renderers; supplied ids
must be unique within a body. Chapter ids/slugs/orders and media ids must be
unique within a v0.2 Publication. Every media placement resolves a media id.
No HTML execution or renderer behavior is defined here.

Canonical Publication roots and blocks reject unknown fields. There are no
price, payment-provider, member, response or checkout fields in these contracts.
The existing generic metadata/extensions slots keep their earlier meaning and
must not be used to smuggle commerce or personal data into content.

## Program/Journey

ProgramSchema has schemaVersion 0.2; stable id/slug; kind program or journey;
status, locale, title, optional description/authors/durationDays; AccessPolicy;
and at least one unit. This is separate from Publication.

A unit is discriminated by kind:
- day: positive day number plus a stable id, title and nonnegative order;
- module: stable id, title and nonnegative order without calendar assumptions.

Unit order is explicit, unique and independent of ids. The schema preserves
input array order; Experience Core must sort a copy by order. Day numbering
must agree with that order. durationDays, when declared, requires every day
from 1 through that number. A module-only program does not need durationDays.

Each unit can reference Publications by exact id (not slug) and contains arrays
of missions, reflections and checkIns. Empty units are rejected. Repeated reads
of one Publication across different days are allowed; repeated references
within one unit are rejected.

Mission: id, title, instructions, required (default true).
Reflection: id, prompt, required (default false).
Check-in: id, kind, prompt, required (default false), with text, scale (min < max)
or choice (at least two options with unique stable ids).
These are templates. No member identity, entered answer, saved reflection,
completion flag or personal progress lives in the editorial schema.

Unit ids/orders/day numbers are unique within a Program. Activity ids share
one namespace within the Program, across units and across activity types.
Keep ids stable when titles, prompts or order change; do not regenerate them
from array positions. This lets downstream progress remain attached to the
same activity. Durable preservation of ids across releases is the publisher's
responsibility; a stateless parser cannot compare an unseen previous release.

## Manifest and reference scope

A v0.2 ContentManifest adds programs (default empty). Publications can be v0.1
or v0.2 during incremental migration. All Program/Collection publicationRefs
must resolve against Publication ids in that same manifest. Missing references,
duplicate ids/slugs and ambiguous id/slug lookups fail validation.

ProgramSchema alone validates structure and local uniqueness; it cannot validate
external references without a publication catalog. Publish only after validating
ContentManifestSchema. Listing/resolution helpers accept either manifest version
and return an empty list/null for legacy manifests.

There is no network lookup, implicit persistence, database access or publication
of partial manifests. Cross-project references are not supported in this contract;
content must be explicitly included in the project-scoped manifest.

## Fixtures, checks and reproduction

Existing Editions/MyPets fixtures plus a canonical Article, Guide and seven-day
Journey are validated. Every Journey day includes a Publication reference,
mission, reflection prompt and check-in template. They are generic original
engineering fixtures, not commercial/private content.

```sh
npm install
npm run typecheck
npm test
npm run validate:examples
npm run build
```

CI repeats these commands on Node 22 and 24. This repository currently has no
lockfile; the existing npm install workflow is preserved. Consumers must pin the
approved Git SHA and their own lockfile. Rollback: keep the old pinned schema SHA.

## Next phase: Experience Core

Only after this contract is approved, add ContentSource Program listing/lookup,
headless ordered Journey model, resolved Publications, activities, and a
project/member-scoped JourneyProgressAdapter with idempotent completion.
Access decisions must use the Program and Publication policies without inferring
payment finality. No implicit persistence. Then review a separate Core PR before
upgrading the Golden Pilot pins and canonical content.
