/**
 * Comprehensive Test Suite Configuration
 * 
 * This file defines the test suite structure and provides utilities
 * for running different types of tests in the product catalog system.
 */

export interface TestSuiteConfig {
  unit: {
    pattern: string[]
    timeout: number
    retries: number
  }
  integration: {
    pattern: string[]
    timeout: number
    retries: number
  }
  e2e: {
    pattern: string[]
    timeout: number
    retries: number
  }
  visual: {
    pattern: string[]
    timeout: number
    retries: number
  }
  performance: {
    pattern: string[]
    timeout: number
    retries: number
  }
  accessibility: {
    pattern: string[]
    timeout: number
    retries: number
  }
}

export const testSuiteConfig: TestSuiteConfig = {
  unit: {
    pattern: [
      'components/**/__tests__/*.test.{ts,tsx}',
      'src/**/__tests__/*.test.{ts,tsx}',
    ],
    timeout: 5000,
    retries: 2,
  },
  integration: {
    pattern: [
      'src/test/integration/*.test.{ts,tsx}',
    ],
    timeout: 10000,
    retries: 3,
  },
  e2e: {
    pattern: [
      'src/test/e2e/*.test.{ts,tsx}',
    ],
    timeout: 30000,
    retries: 3,
  },
  visual: {
    pattern: [
      'src/test/visual/*.test.{ts,tsx}',
    ],
    timeout: 15000,
    retries: 2,
  },
  performance: {
    pattern: [
      'src/test/performance.test.ts',
      'src/test/responsive-styles.test.ts',
    ],
    timeout: 20000,
    retries: 1,
  },
  accessibility: {
    pattern: [
      'src/test/accessibility.test.ts',
    ],
    timeout: 10000,
    retries: 2,
  },
}

export const coverageThresholds = {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  },
  perFile: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}

export const testEnvironments = {
  jsdom: {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  },
  node: {
    testEnvironment: 'node',
  },
}

export const mockConfig = {
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
}

/**
 * Test categories for organizing and running specific test types
 */
export const testCategories = {
  smoke: 'Basic functionality tests',
  regression: 'Tests to prevent regressions',
  performance: 'Performance and optimization tests',
  accessibility: 'Accessibility compliance tests',
  visual: 'Visual regression tests',
  integration: 'Component integration tests',
  e2e: 'End-to-end user workflow tests',
  unit: 'Individual component unit tests',
} as const

export type TestCategory = keyof typeof testCategories