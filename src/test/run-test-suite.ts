#!/usr/bin/env node

/**
 * Comprehensive Test Suite Runner
 * 
 * This script provides a unified interface for running different types of tests
 * in the product catalog system with proper reporting and coverage.
 */

import { execSync } from 'child_process'
import { testSuiteConfig, TestCategory } from './test-suite.config'

interface TestRunOptions {
  category?: TestCategory
  coverage?: boolean
  watch?: boolean
  verbose?: boolean
  bail?: boolean
}

class TestSuiteRunner {
  private options: TestRunOptions

  constructor(options: TestRunOptions = {}) {
    this.options = {
      coverage: true,
      verbose: false,
      bail: false,
      ...options,
    }
  }

  /**
   * Run all tests in the suite
   */
  async runAll(): Promise<void> {
    console.log('🚀 Running comprehensive test suite...\n')

    const categories: TestCategory[] = ['unit', 'integration', 'visual', 'e2e', 'performance', 'accessibility']
    
    for (const category of categories) {
      try {
        console.log(`\n📋 Running ${category} tests...`)
        await this.runCategory(category)
        console.log(`✅ ${category} tests completed successfully`)
      } catch (error) {
        console.error(`❌ ${category} tests failed:`, error)
        if (this.options.bail) {
          process.exit(1)
        }
      }
    }

    if (this.options.coverage) {
      await this.generateCoverageReport()
    }

    console.log('\n🎉 Test suite completed!')
  }

  /**
   * Run tests for a specific category
   */
  async runCategory(category: TestCategory): Promise<void> {
    const config = testSuiteConfig[category as keyof typeof testSuiteConfig]
    if (!config) {
      throw new Error(`Unknown test category: ${category}`)
    }

    const command = this.buildVitestCommand(config.pattern, {
      timeout: config.timeout,
      retries: config.retries,
    })

    try {
      execSync(command, { 
        stdio: this.options.verbose ? 'inherit' : 'pipe',
        encoding: 'utf8',
      })
    } catch (error) {
      throw new Error(`Failed to run ${category} tests`)
    }
  }

  /**
   * Run smoke tests (critical functionality)
   */
  async runSmoke(): Promise<void> {
    console.log('🔥 Running smoke tests...')
    
    const smokeTests = [
      'components/product-catalog/__tests__/ProductCatalogPage.test.tsx',
      'components/product-catalog/__tests__/ProductCard.test.tsx',
      'components/product-catalog/__tests__/FilterSidebar.test.tsx',
    ]

    const command = this.buildVitestCommand(smokeTests, { timeout: 10000 })
    
    try {
      execSync(command, { stdio: 'inherit' })
      console.log('✅ Smoke tests passed')
    } catch (error) {
      console.error('❌ Smoke tests failed')
      throw error
    }
  }

  /**
   * Run regression tests
   */
  async runRegression(): Promise<void> {
    console.log('🔄 Running regression tests...')
    
    // Run all tests except performance tests for regression
    const categories: TestCategory[] = ['unit', 'integration', 'visual', 'accessibility']
    
    for (const category of categories) {
      await this.runCategory(category)
    }
    
    console.log('✅ Regression tests completed')
  }

  /**
   * Generate comprehensive coverage report
   */
  async generateCoverageReport(): Promise<void> {
    console.log('\n📊 Generating coverage report...')
    
    const command = 'npx vitest run --coverage --reporter=verbose'
    
    try {
      execSync(command, { stdio: 'inherit' })
      console.log('✅ Coverage report generated in ./coverage/')
    } catch (error) {
      console.error('❌ Failed to generate coverage report')
      throw error
    }
  }

  /**
   * Build vitest command with options
   */
  private buildVitestCommand(
    patterns: string[], 
    options: { timeout?: number; retries?: number } = {}
  ): string {
    let command = 'npx vitest run'
    
    if (this.options.coverage) {
      command += ' --coverage'
    }
    
    if (this.options.verbose) {
      command += ' --reporter=verbose'
    }
    
    if (options.timeout) {
      command += ` --testTimeout=${options.timeout}`
    }
    
    if (this.options.watch) {
      command = command.replace('run', 'watch')
    }
    
    // Add test patterns
    command += ` ${patterns.join(' ')}`
    
    return command
  }

  /**
   * Validate test environment
   */
  async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating test environment...')
    
    try {
      // Check if vitest is available
      execSync('npx vitest --version', { stdio: 'pipe' })
      
      // Check if required test files exist
      const requiredFiles = [
        'src/test/setup.ts',
        'vitest.config.ts',
      ]
      
      for (const file of requiredFiles) {
        try {
          execSync(`test -f ${file}`, { stdio: 'pipe' })
        } catch {
          throw new Error(`Required file missing: ${file}`)
        }
      }
      
      console.log('✅ Test environment validated')
    } catch (error) {
      console.error('❌ Test environment validation failed:', error)
      throw error
    }
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  const runner = new TestSuiteRunner({
    coverage: !args.includes('--no-coverage'),
    verbose: args.includes('--verbose'),
    watch: args.includes('--watch'),
    bail: args.includes('--bail'),
  })

  try {
    await runner.validateEnvironment()
    
    switch (command) {
      case 'all':
        await runner.runAll()
        break
      case 'smoke':
        await runner.runSmoke()
        break
      case 'regression':
        await runner.runRegression()
        break
      case 'unit':
      case 'integration':
      case 'e2e':
      case 'visual':
      case 'performance':
      case 'accessibility':
        await runner.runCategory(command as TestCategory)
        break
      default:
        console.log(`
Usage: npm run test:suite [command] [options]

Commands:
  all           Run all test categories
  smoke         Run smoke tests (critical functionality)
  regression    Run regression test suite
  unit          Run unit tests
  integration   Run integration tests
  e2e           Run end-to-end tests
  visual        Run visual regression tests
  performance   Run performance tests
  accessibility Run accessibility tests

Options:
  --no-coverage Skip coverage reporting
  --verbose     Verbose output
  --watch       Watch mode
  --bail        Stop on first failure

Examples:
  npm run test:suite all
  npm run test:suite smoke --verbose
  npm run test:suite unit --watch
  npm run test:suite regression --bail
        `)
    }
  } catch (error) {
    console.error('Test suite failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { TestSuiteRunner }