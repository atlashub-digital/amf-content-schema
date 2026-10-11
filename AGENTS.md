# AGENTS.md

## Mission

Keep AMF content portable across products, frameworks and commercial models.

## Allowed changes

Codex may:
- add backwards-compatible schema fields;
- improve validation and examples;
- add migration helpers;
- add fixtures from pilot projects;
- improve tests and documentation.

## Guardrails

Do not:
- import React, Next.js, Supabase, Stripe or XPayments;
- encode prices or checkout state machines as reader requirements;
- encode a specific project's visual theme;
- weaken validation solely to make a fixture pass;
- make an existing field incompatible without a schema-version migration.

## Required workflow

1. Work on a branch.
2. Add/update tests and fixtures.
3. Run typecheck, tests and build.
4. Open a PR describing compatibility impact.
5. Never auto-merge schema-breaking changes.

## Compatibility principle

Prefer optional extensions over project-specific core fields. The core schema should remain small enough to represent both AtlasHub Editions and MyPets without either product becoming the default model.
