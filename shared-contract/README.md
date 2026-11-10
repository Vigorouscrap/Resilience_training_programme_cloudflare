# Shared API contract package

This directory is the platform-independent M2 contract source for Cloudflare Worker and Tencent Fastify deployments.

- `index.mjs`: API paths, stable error codes, hook manifest, identity/module validation, and access calculation.
- `schema.json`: portable JSON Schema definitions for shared response shapes.
- `index.test.mjs`: deterministic unit tests for identity, 42-day indexing, Shanghai unlock time, roles, and hook manifest.

Commands from the repository root:

```bash
npm run test:contract:unit
npm run test:contract:fastify-local
npm run test:contract -- https://api.example.com health
npm run test:contract -- https://api.example.com core
npm run test:contract -- https://api.example.com ai
npm run test:contract -- https://api.example.com research
npm run test:contract -- https://api.example.com full
```

The `core`, `ai`, `research`, and `full` profiles can create records. `research` creates unique ordinary participant identities, marks participant/session metadata with `testData: true`, saves events, and completes module 1-1 for one test identity. It checks event counts, module access, cross-session replay, and isolation; it retains and prints its test codes. It never resets an existing participant. `ai` uses a synthetic session and can make a provider request.

`full` runs all currently implemented profiles; it does **not** cover all 20 requirements in the formal contract. Both adapters now support all profiles in code. Production rollout is separate; see `docs/M3_IMPLEMENTATION_AND_DEPLOYMENT.md` for evidence, limits and deployment order.

`research.mjs` is the shared runtime service: identity, access, module mutations, events, replay and export validation. Adapters implement the SQL/transaction interface. The portable JSON Schema describes normalized identity, module, duration, events, replay, access and AI shapes; schema consumers must normalize identity inputs first. Runtime normalization and validation live in the shared service, rather than a separate platform validator. The capability matrix records code route availability, not complete conformance or deployment status.

`npm run test:research` uses PostgreSQL/PGlite and SQLite to execute migrations and verify isolation, transactions, retries, concurrent completion, both HTTP bridges and exports. It also runs `full` against a temporary localhost Fastify server. These fixtures do not replace real PostgreSQL multi-connection or D1 production checks.
