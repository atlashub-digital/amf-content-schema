# AMF Content Schema

Framework-agnostic, versioned content contracts for AMF-powered products.

## Why this repository exists

AMF projects must be able to change design, runtime and commercial model without rewriting editorial content. This package defines the portable language shared by AtlasHub Editions, MyPets, MyTrainX, LIA / LeveLab, EspelhoMeu and future projects.

The schema deliberately separates:

- **content** — publications, chapters, media and collections;
- **access** — who may read something and why;
- **commerce** — prices, checkout and providers live elsewhere;
- **presentation** — themes and React components live elsewhere.

## v0.1 contracts

- `Publication`
- `Chapter`
- `MediaAsset`
- `MediaPlacement`
- `Collection`
- `AccessPolicy`
- `ContentManifest`

The first compatibility fixtures represent two deliberately different sources:

1. **AtlasHub Editions** — structured long-form manuscript with chapters.
2. **MyPets** — Markdown-first guide with rich media placements and campaign entitlement.

## Commands

```bash
npm install
npm run typecheck
npm test
npm run build
```

## Design rule

A publication must not contain provider-specific payment logic or React/UI code. A renderer should be able to consume the same publication through radically different themes.

## v0.2 — canonical Article and Program/Journey

v0.1 Publication, BodySource and manifest inputs remain supported. The package
adds strict v0.2 publications and a separate Program contract, not a long
Publication. Existing `type: "program"` Publications remain readable for
compatibility; new journeys use `ProgramSchema`.

- `ContentBlockSchema`: paragraph, heading and callout (discriminated).
- `CanonicalBodySourceSchema` / `CanonicalPublicationSchema`: strict v0.2 content.
- `ProgramSchema`: ordered days/modules, Publication ids, missions, reflection
  prompts and check-in templates.
- `ContentManifestSchema`: accepts v0.1 and v0.2. v0.2 validates all Program and
  Collection publication references, uniqueness and lookup ambiguity.
- `listManifestPrograms` / `findManifestProgram`: version-aware listing and
  lookup by stable id or slug; v0.1 has no programs.
- `examples/content-manifest.json`: Article + Guide + seven-day Journey.
  Existing Editions and MyPets fixtures are retained and tested.

Run `npm run validate:examples` as well as typecheck/tests/build.
CI runs every check on Node 22 and 24.
See [v0.2 contracts and compatibility](docs/CONTRACTS_V0_2.md).

The schema contains editorial prompts only. Member responses/progress,
persistence, authentication, payment providers, prices, themes and renderers
belong in other layers. Experience Core integration starts after human approval
of this contract; this PR does not update downstream dependency pins.
