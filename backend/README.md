# Backend

This directory contains the standalone backend scaffold for the resilience programme.

## Current scope

The current scaffold focuses on:

- configuration and secret management
- DeepSeek provider abstraction
- prompt registry
- anonymous session foundation
- module context foundation
- Prisma schema for future persistence

The frontend is not wired to this backend yet. That work belongs to the next stage in `docs/IMPLEMENTATION_ROADMAP.md`.

## Local setup

1. Copy `.env.example` to `.env.local` or `.env`.
2. Install dependencies:

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

The default server port is `8787`.
