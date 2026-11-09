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
npm run test:contract -- https://api.example.com full
```

The `core`, `ai`, and `full` profiles can create records. Use registered test identities and a non-production database unless the test data is intentionally marked for exclusion from research exports.
