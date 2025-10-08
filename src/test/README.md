# Comprehensive Test Suite Documentation

This directory contains a comprehensive test suite for the Product Catalog Page feature, covering all aspects of functionality, performance, accessibility, and user experience.

## Test Structure

### 📁 Directory Organization

```
src/test/
├── README.md                     # This documentation
├── setup.ts                      # Test environment setup
├── test-suite.config.ts          # Test configuration
├── run-test-suite.ts            # Test runner script
├── mocks/
│   └── productData.ts           # Mock data for testing
├── integration/
│   └── user-workflows.test.tsx  # Complete user workflow tests
├── visual/
│   └── visual-regression.test.tsx # Visual consistency tests
├── error-handling/
│   └── edge-cases.test.tsx      # Error handling and edge cases
└── e2e/
    └── critical-paths.test.tsx  # End-to-end critical user paths
```

## Test Categories

### 🧪 Unit Tests
- **Location**: `components/**/__tests__/*.test.tsx`, `src/**/__tests__/*.test.tsx`
- **Purpose**: Test individual components and functions in isolation
- **Coverage**: All components, hooks, utilities, and types
- **Run**: `npm run test:unit`

### 🔗 Integration Tests
- **Location**: `src/test/integration/`
- **Purpose**: Test component interactions and complete user workflows
- **Coverage**: Filter + grid interactions, cart/wishlist integration, pagination with filters
- **Run**: `npm run test:integration`

### 👁️ Visual Regression Tests
- **Location**: `src/test/visual/`
- **Purpose**: Ensure consistent visual appearance across different states
- **Coverage**: Layout consistency, responsive behavior, component states
- **Run**: `npm run test:visual`

### 🚨 Error Handling Tests
- **Location**: `src/test/error-handling/`
- **Purpose**: Test error scenarios and edge cases
- **Coverage**: Network failures, malformed data, browser compatibility
- **Run**: `npm run test:error-handling`

### 🎯 End-to-End Tests
- **Location**: `src/test/e2e/`
- **Purpose**: Test complete user journeys from start to finish
- **Coverage**: Shopping workflows, mobile experiences, performance scenarios
- **Run**: `npm run test:e2e`

### ⚡ Performance Tests
- **Location**: `src/test/performance.test.ts`
- **Purpose**: Ensure optimal performance under various conditions
- **Coverage**: Large datasets, rapid interactions, memory usage
- **Run**: `npm run test:performance`

### ♿ Accessibility Tests
- **Location**: `src/test/accessibility.test.ts`
- **Purpose**: Ensure WCAG compliance and screen reader compatibility
- **Coverage**: ARIA labels, keyboard navigation, focus management
- **Run**: `npm run test:accessibility`

## Running Tests

### Quick Commands

```bash
# Run all tests with coverage
npm run test:coverage

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e
npm run test:visual
npm run test:performance
npm run test:accessibility

# Run comprehensive test suite
npm run test:suite all

# Run smoke tests (critical functionality)
npm run test:smoke

# Run regression test suite
npm run test:regression

# Watch mode for development
npm run test:watch
```

### Advanced Test Runner

The custom test runner (`src/test/run-test-suite.ts`) provides additional options:

```bash
# Run all tests with verbose output
npm run test:suite all --verbose

# Run tests and stop on first failure
npm run test:suite regression --bail

# Run specific category without coverage
npm run test:suite unit --no-coverage

# Watch mode for specific category
npm run test:suite integration --watch
```

## Test Coverage

### Coverage Thresholds

- **Global**: 80% minimum for branches, functions, lines, and statements
- **Per File**: 70% minimum for individual files
- **Reports**: Generated in `./coverage/` directory

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/index.html
```

## Test Data and Mocks

### Mock Data Structure

The test suite uses comprehensive mock data located in `src/test/mocks/productData.ts`:

- **Products**: 24 mock products with various states (on sale, out of stock, etc.)
- **Filter Options**: Complete filter configurations
- **Edge Cases**: Products with no images, long names, many colors
- **Filter States**: Empty and active filter configurations

### Mock Hooks

All external dependencies are mocked for consistent testing:

- `useCart`: Cart functionality
- `useWishlist`: Wishlist functionality  
- `useAuth`: Authentication state
- `useRouter`: Next.js navigation
- `Image`: Next.js Image component

## Test Scenarios Covered

### 🛒 Shopping Workflows
- Browse products → Apply filters → Sort → Select color → Add to cart
- Mobile filter drawer workflow
- Pagination with filter persistence
- Wishlist management

### 🔍 Filter and Search
- Multi-filter combinations
- Price range filtering
- Filter clearing and resetting
- No results scenarios
- Invalid filter inputs

### 📱 Responsive Behavior
- Desktop, tablet, and mobile layouts
- Viewport changes during interaction
- Touch interactions
- Mobile filter drawer

### ⚠️ Error Scenarios
- Network failures
- Malformed data
- Missing images
- API errors
- Browser compatibility issues

### 🎨 Visual Consistency
- Component appearance across states
- Loading skeletons
- Empty states
- Sale badges and pricing
- Color swatch rendering

### ♿ Accessibility
- Screen reader compatibility
- Keyboard navigation
- ARIA labels and roles
- Focus management
- High contrast support

## Performance Testing

### Metrics Tracked
- Component render times
- Filter application speed
- Large dataset handling
- Memory usage
- Bundle size impact

### Performance Thresholds
- Filter application: < 100ms
- Page navigation: < 200ms
- Image loading: Progressive with lazy loading
- Memory leaks: None detected

## Continuous Integration

### Pre-commit Hooks
```bash
# Run smoke tests before commit
npm run test:smoke

# Run full regression suite
npm run test:regression
```

### CI Pipeline Integration
```yaml
# Example GitHub Actions workflow
- name: Run Test Suite
  run: |
    npm run test:suite all --bail
    npm run test:coverage
```

## Debugging Tests

### Common Issues

1. **Mock Issues**: Ensure all external dependencies are properly mocked
2. **Timing Issues**: Use `waitFor` for async operations
3. **DOM Queries**: Use `data-testid` attributes for reliable element selection
4. **Viewport Issues**: Mock `window.innerWidth` for responsive tests

### Debug Commands

```bash
# Run tests with verbose output
npm run test:suite unit --verbose

# Run single test file
npx vitest run components/product-catalog/__tests__/ProductCard.test.tsx

# Debug specific test
npx vitest run --reporter=verbose --testNamePattern="should handle cart workflow"
```

## Contributing to Tests

### Adding New Tests

1. **Unit Tests**: Add to component `__tests__` directory
2. **Integration Tests**: Add to `src/test/integration/`
3. **E2E Tests**: Add to `src/test/e2e/`
4. **Mock Data**: Update `src/test/mocks/productData.ts` as needed

### Test Naming Conventions

- **Files**: `*.test.tsx` or `*.test.ts`
- **Describe blocks**: Component or feature name
- **Test cases**: "should [expected behavior] when [condition]"

### Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **Mock External Dependencies**: Keep tests isolated
3. **Use Data Test IDs**: Reliable element selection
4. **Test User Behavior**: Focus on user interactions, not implementation
5. **Cover Edge Cases**: Test error scenarios and boundary conditions

## Maintenance

### Regular Tasks

- Update mock data when product schema changes
- Review and update coverage thresholds
- Add tests for new features
- Update visual regression baselines
- Performance benchmark updates

### Test Health Monitoring

- Monitor test execution times
- Track flaky tests
- Review coverage reports
- Update browser compatibility tests

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Next.js Testing](https://nextjs.org/docs/testing)