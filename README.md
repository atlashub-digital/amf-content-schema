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
