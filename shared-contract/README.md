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

`full` runs all currently implemented profiles; it does **not** cover all 20 requirements in the formal contract. See `docs/M2_DEPLOYMENT_VALIDATION.md` for evidence and remaining checks. Fastify currently supports only the `health` and `ai` profiles; research endpoints are M3 work.

The portable JSON Schema currently defines error, access, and AI response shapes. The runtime handlers still maintain their own validation/access implementations; wiring them to the shared definitions and extending research-data schemas remain M3 tasks. The capability matrix records route availability, not complete conformance.
