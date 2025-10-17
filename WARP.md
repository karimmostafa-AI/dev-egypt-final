# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: Next.js 15 (App Router) + TypeScript e-commerce app with Appwrite backend services, Tailwind CSS, Vitest testing.

Commands
- Install deps: npm install
- Dev server (Turbopack): npm run dev
- Build: npm run build
- Start (prod): npm start
- Lint: npm run lint
- Tests (Vitest):
  - All tests (watch): npm run test
  - All tests (CI): npm run test:run
  - With coverage: npm run test:coverage
  - Unit: npm run test:unit
  - Integration: npm run test:integration
  - E2E: npm run test:e2e
  - Visual: npm run test:visual
  - Performance: npm run test:performance
  - Accessibility: npm run test:accessibility
  - Comprehensive runner: npm run test:suite all
  - Smoke/regression: npm run test:smoke / npm run test:regression
  - Watch mode: npm run test:watch
  - Run a single test file: npx vitest run path/to/test.test.tsx
  - Run a single test by name: npx vitest run --testNamePattern="<substring>"

Key configuration
- TypeScript paths: "@/*" -> "src/*" (see tsconfig.json)
- Vitest: jsdom env, setup at src/test/setup.ts, coverage thresholds at vitest.config.ts
- ESLint: Flat config (eslint.config.mjs)
- Next config: next.config.ts (images, performance flags)

Architecture overview
- App Router and pages (src/app)
  - Public pages (home, catalog, product, cart/checkout, auth flows)
  - Admin area (src/app/admin/*) with pages for analytics, products, orders, customers, brands, settings; server routes under src/app/api
  - API routes (src/app/api/*): feature-scoped subtrees for auth, products, orders, customers, analytics, storage, image pipeline, etc. Admin APIs under src/app/api/admin/*
- Domain and services (src/lib)
  - Appwrite integration: appwrite.ts, appwrite-service.ts, appwrite-admin.ts, setup-appwrite.ts; auth-middleware.ts and rbac-service.ts for JWT/RBAC
  - Core services: product-service.ts, order-service.ts, customer-service.ts, email-service.ts
  - Image pipeline: image-service.ts, image-optimization-service.ts, placeholder-service.ts, image-validation-service.ts, image-caching-service.ts, image-optimization-pipeline.ts
  - Brand/variations: brand-landing-service.ts, brand-auto-generation-service.ts, product-variation-service.ts, EnhancedVariationService.ts, variation-generator.ts, legacy-variation-converter.ts
  - Caching/perf: services/CacheService.ts, performance-optimization-service.ts, performance-benchmarks.ts, bundle-optimization.ts
  - Repositories: repositories/ProductRepository.ts (data access abstraction)
  - Schema and migration: database-schema.ts, database-migration.ts; scripts/run-migration.ts
  - React Query provider: react-query-provider.tsx
  - Error handling: error-handler.ts
- State and hooks
  - Contexts: contexts/AuthContext.tsx, LocationContext.tsx; context/CartContext.tsx
  - Hooks: src/hooks/* (auth, cart, product catalog/details/variations, notifications, debounce, URL sync, recently viewed, real-time pricing)
- UI and components
  - components/ui/* (shadcn-based primitives)
  - Product catalog UI: components/product-catalog/*; admin UI in components/admin/*
  - Cross-cutting UI: EnhancedErrorBoundary, image galleries, PWA prompts, loading states
- Types and utilities
  - types/* (domain models: product, variations, admin/common)
  - utils/* (filterUtils, performance, accessibility, className util)
- Styles and Tailwind
  - Tailwind v4 config: tailwind.config.js; styles at styles/* (including animations)

Testing layout
- Config: vitest.config.ts (jsdom, coverage to ./coverage)
- Suite orchestration: src/test/test-suite.config.ts and src/test/run-test-suite.ts
- Categories:
  - Unit: components/**/__tests__ and src/**/__tests__
  - Integration: src/test/integration/*
  - E2E: src/test/e2e/*
  - Visual: src/test/visual/*
  - Performance: src/test/performance.test.ts, src/test/responsive-styles.test.ts
  - Accessibility: src/test/accessibility.test.ts
- Docs: src/test/README.md and src/test/COMPREHENSIVE_TEST_SUITE.md

Notes for agents
- Prefer calling domain services in src/lib from API route handlers to keep concerns separated.
- Admin functionality lives under src/app/admin and src/app/api/admin; ensure RBAC via rbac-service.ts/auth-middleware.ts.
- When adding new features, keep type definitions in types/* and shared logic in src/lib/services or utils.
