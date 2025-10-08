# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Full-stack e-commerce backend/UI built with Next.js 15 (App Router), TypeScript, Tailwind, and Appwrite. Vitest + Testing Library for tests. Docker Compose provided for local Appwrite infra and Nginx proxy.

Core commands
- Install dependencies
  ```bash path=null start=null
  npm install
  ```
- Development server (Turbopack)
  ```bash path=null start=null
  npm run dev
  ```
- Build and start (production)
  ```bash path=null start=null
  npm run build
  npm start
  ```
- Lint
  ```bash path=null start=null
  npm run lint
  ```

Testing (Vitest)
- Run all tests / watch / coverage
  ```bash path=null start=null
  npm run test
  npm run test:watch
  npm run test:coverage
  ```
- Run a single test file
  ```bash path=null start=null
  # example (adjust path as needed)
  npm run test:run -- src/test/integration/user-workflows.test.tsx
  # or
  npx vitest run src/test/integration/user-workflows.test.tsx
  ```
- Run tests matching a name pattern
  ```bash path=null start=null
  npx vitest run --testNamePattern="should handle cart workflow"
  ```
- Category suites
  ```bash path=null start=null
  npm run test:unit
  npm run test:integration
  npm run test:e2e
  npm run test:visual
  npm run test:performance
  npm run test:accessibility
  ```
- Custom suite runner
  ```bash path=null start=null
  npm run test:suite all
  npm run test:smoke
  npm run test:regression
  ```
- Coverage report location
  ```bash path=null start=null
  ./coverage/index.html
  ```

Environment and services
- Env file
  ```bash path=null start=null
  # copy template to local env
  # macOS/Linux
  cp .env.example .env.local
  # Windows PowerShell
  Copy-Item .env.example .env.local
  ```
- Required variables (examples; set values per your Appwrite project)
  ```bash path=null start=null
  NEXT_PUBLIC_APPWRITE_ENDPOINT=...
  NEXT_PUBLIC_APPWRITE_PROJECT_ID=...
  NEXT_PUBLIC_APPWRITE_DATABASE_ID=...
  APPWRITE_API_KEY=...
  JWT_SECRET=...
  ```
- Local Appwrite stack via Docker Compose
  ```bash path=null start=null
  docker-compose up -d
  ```
  Notes: Compose spins up Appwrite (port 3001), MariaDB, Redis, optional Next.js container and Nginx. The app itself runs on http://localhost:3000 when using npm run dev.

High-level architecture
- Next.js application (TypeScript, App Router)
  - Path aliases: imports using @/* map to ./src/* (see tsconfig.json and vitest.config.ts)
  - Performance: Next.js Turbopack used for dev/build; experimental optimizePackageImports configured in next.config.ts
  - Images: next.config.ts configures formats, sizes, and long TTL caching
- Authentication and route protection (Appwrite)
  - Middleware: src/middleware.ts validates session server-side using Appwrite Account.get()
  - Public paths include /, /account, /register, /admin/login, /admin/forgot-password, /api/auth/*, and Next static assets
  - On failed auth, redirects to /admin/login for admin routes, or to /account with a redirect param for protected user routes (e.g., /checkout, /profile, /orders)
  - For implementation details and usage examples, see AUTHENTICATION_README.md
- API and services
  - API endpoints are implemented under Next.js app routes (see README’s API Endpoints section). Postman collection at docs/api-documentation.json documents endpoints for auth, products, orders, customers, analytics, and bulk operations
  - Business logic is organized under src/lib/* (auth/product/order/customer services, security utilities, error handling) per README’s project structure
- UI and components
  - Components live under components/ and src/app/* for App Router pages; UI built with Tailwind, Radix UI, and shadcn configuration (see components.json)
- Testing strategy (Vitest + Testing Library)
  - Test environment: jsdom; global setup at src/test/setup.ts
  - Coverage thresholds: 80% global for branches, functions, lines, statements; reports at ./coverage (text, json, html)
  - Organization: unit tests under components/**/__tests__ and src/**/__tests__; integration at src/test/integration; e2e at src/test/e2e; visual at src/test/visual; performance and accessibility at dedicated files; custom runner at src/test/run-test-suite.ts
- Linting
  - ESLint flat config extends Next core-web-vitals and typescript; ignores node_modules, .next, build/out, example files, and test directories

Notes for working in this repo
- Use the provided npm scripts (which already enable Turbopack) for dev and build; avoid invoking next directly unless necessary
- Most routes are protected by middleware; when adding new areas that require auth, ensure they’re covered by middleware and that redirect flows are correct
- When authoring tests, prefer RTL and keep them under existing category folders to participate in coverage and suites
- For API exploration, import docs/api-documentation.json into Postman; bearer token variable is {{jwt_token}}
