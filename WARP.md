# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project type: Next.js 15 + TypeScript + Tailwind CSS with Vitest for testing and ESLint (flat config). Optional local Appwrite stack via Docker Compose.

Commands
- Install deps
  - npm ci (CI/reproducible) or npm install
- Dev server (Turbopack)
  - npm run dev
  - If Turbopack issues: npm run dev:legacy
- Build/serve
  - npm run build
  - npm start
- Lint
  - npm run lint
  - Lint a path/file: npx eslint src/your/file.tsx
- Tests (Vitest)
  - All tests (interactive): npm run test
  - All tests (CI): npm run test:run
  - Coverage: npm run test:coverage (HTML in coverage/index.html)
  - Watch: npm run test:watch
  - Categories:
    - Unit: npm run test:unit
    - Integration: npm run test:integration
    - E2E: npm run test:e2e
    - Visual: npm run test:visual
    - Performance: npm run test:performance
    - Accessibility: npm run test:accessibility
    - Smoke: npm run test:smoke
    - Regression: npm run test:regression
  - Custom suite runner: npm run test:suite all
  - Run a single test file:
    - npx vitest run path/to/test.test.tsx
  - Run a single test by name:
    - npx vitest run --reporter=verbose --testNamePattern="your test name"

Environment
Create .env.local (see README for full list). Minimum commonly required values when integrating with Appwrite:
- NEXT_PUBLIC_APPWRITE_ENDPOINT
- NEXT_PUBLIC_APPWRITE_PROJECT_ID
- NEXT_PUBLIC_APPWRITE_DATABASE_ID
- APPWRITE_API_KEY
- JWT_SECRET

Local services (Docker)
- Bring up full stack (Appwrite, DB, Redis, Next.js, Nginx, backup):
  - docker compose up -d
- Start only Appwrite deps for local dev (console, DB, Redis):
  - docker compose up -d appwrite mariadb redis
- Follow logs:
  - docker compose logs -f appwrite

Architecture and important configuration
- Framework/runtime
  - Next.js 15 with App Router (expected under src/app). TypeScript strict mode; ESM modules.
  - Path alias @ -> ./src (tsconfig.json paths and vitest.resolve.alias).
- Testing
  - Vitest with @vitejs/plugin-react and jsdom environment.
  - Global setup: ./src/test/setup.ts (vitest.config.ts test.setupFiles).
  - Coverage: v8 provider; reports text/json/html in ./coverage with 80% global thresholds; includes src/**/* and components/**/*.
- Linting
  - Flat ESLint config (eslint.config.mjs) extending next/core-web-vitals and next/typescript.
  - Ignores: node_modules, .next, out, build, next-env.d.ts, **/*.example.tsx, **/__tests__/**, **/test/**.
- Styling
  - Tailwind CSS v4 (tailwind.config.js + @tailwindcss/postcss in postcss.config.mjs).
  - Content globs under src/pages, src/components, src/app, and src/**; theme relies on CSS custom properties (e.g., --primary).
- Next.js configuration (next.config.ts)
  - Production chunk splitting for better caching; disables Node core fallbacks (fs/path/crypto) on client to avoid hydration issues.
  - Image optimization: explicit remotePatterns for common CDNs plus permissive HTTPS wildcard; unoptimized in development.
  - Rewrites: /uploads/:path* -> /api/uploads/:path*.
  - Headers: long-term cache headers for uploads; permissive CORS on /api/*.
  - Optional bundle analyzer when ANALYZE=true.
  - Production opts: poweredByHeader=false, generateEtags=false.
- Docker Compose (docker-compose.yml)
  - Services: appwrite, mariadb, redis, nextjs (builds from Dockerfile), nginx, backup sidecar for daily archives.

Repo conventions and layout
- Source expected under src/ with app/, components/, hooks/, utils/ (per Next.js and Tailwind globs). Use @/… imports rather than relative chains.
- Tests live alongside components (components/**/__tests__) and under src/test for integration/e2e/visual/perf/accessibility; use the provided npm scripts to target categories.

Notes and gotchas
- If images fail to load from a new domain in production, add the domain to images.remotePatterns in next.config.ts.
- When importing Node-only modules on the client, expect resolution to fail (fs/path/crypto are set to false). Keep such imports server-only.
- For performance analysis locally, set ANALYZE=true when running the Next.js build to enable @next/bundle-analyzer.
