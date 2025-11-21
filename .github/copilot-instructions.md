# GitHub Copilot Instructions for MSAL.js Repository

## Repository Overview

This repository contains the Microsoft Authentication Library for JavaScript (MSAL.js), a comprehensive authentication solution that enables JavaScript applications to authenticate users with Microsoft Identity Platform. The repository supports work and school accounts (Azure AD), personal Microsoft accounts (MSA), and social identity providers through Azure AD B2C.

### High-Level Repository Information

- **Type**: Monorepo with multiple npm packages using npm workspaces
- **Size**: Large repository with 140+ package.json files across packages and samples
- **Languages**: TypeScript (primary), JavaScript
- **Build System**: Rollup for bundling, npm workspaces for monorepo management  
- **Testing**: Jest for unit testing across all packages
- **Target Runtimes**: Browser (client-side), Node.js (server-side)
- **Package Management**: Beachball for versioning and changelog management
- **Node.js Requirement**: Node 18+

### Key Packages

- **`@azure/msal-common`**: Core authentication logic shared across platforms
- **`@azure/msal-browser`**: Browser-specific implementation
- **`@azure/msal-node`**: Node.js server-side implementation  
- **`@azure/msal-react`**: React wrapper for msal-browser
- **`@azure/msal-angular`**: Angular wrapper for msal-browser
- **`msal-node-extensions`**: Additional support for token cache serialization

## Build and Validation Instructions

### Prerequisites and Environment Setup

1. **Always use Node.js 18+**
2. **Always run `npm install` at repository root first** to bootstrap the monorepo
3. Repository uses npm workspaces - dependencies are shared and managed at root level

### Essential Build Commands

**CRITICAL: Always build dependencies in correct order. msal-common must be built before msal-browser/msal-node. msal-browser must be built before msal-react/msal-angular.**

```bash
# 1. Bootstrap repository (ALWAYS required first)
cd microsoft-authentication-library-for-js/
npm install

# 2. Build specific package with dependencies (RECOMMENDED)
cd lib/msal-browser
npm run build:all  # Builds msal-common first, then msal-browser

# 3. Build individual package only (only if dependencies already built)
npm run build

# 4. Clean build artifacts
npm run clean
```

### Testing Commands

```bash
# Run tests in specific package
cd lib/msal-browser
npm test

# Tests take ~40 seconds and may show worker process warnings - this is normal
```

### Linting and Formatting

```bash
# Lint code (ALWAYS run before committing)
cd lib/msal-browser
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code  
npm run format:fix
npm run format:check
```

### API Extractor (Required for Public API Changes)

When making changes that affect public APIs:

```bash
cd lib/msal-browser
npm run build  # Must build first
npm run apiExtractor  # Check for API changes
npm run apiExtractor -- --local  # Update API reports (commit the .api.md files)
```

### Beachball Change Files (Required for All PRs)

**Every PR to dev branch requires a change file:**

```bash
# From repository root - run AFTER creating PR
npm run beachball:change

# Check if change files are valid
npm run beachball:check
```

**Change Types:**
- `None`: Documentation, build files, test files, samples only
- `Patch`: Bug fixes and minor features
- `Minor`: New features and major bug fixes  
- `Major`: Breaking changes (Never make breaking changes to libraries)

**Change Message:**
Change message should always include a description of the change followed by the PR number (as a link to the PR).

Template: Brief description of change [#XXXX](PR_URL)
Example: Fix documentation [#7880](https://github.com/AzureAD/microsoft-authentication-library-for-js/pull/7880)

### Common Build Issues and Solutions

1. **"Cannot find module" errors**: Run `npm install` at repository root first
2. **Build failures**: Always build msal-common before msal-browser/msal-node and msal-browser before msal-react/msal-angular using `npm run build:all`
3. **Node version warnings**: Use Node 18 for maximum compatibility
4. **Jest worker process warnings**: Normal behavior, tests still pass
5. **API Extractor errors**: Build the package first, then run API extractor

### Validation Pipeline Requirements

Before merging any PR:

1. **Beachball Check**: Validates change files exist for modified packages
2. **Build Validation**: All packages must build successfully
3. **Test Validation**: All tests must pass
4. **Lint Validation**: Code must pass ESLint rules
5. **API Extractor**: Public API changes must be documented

## Project Architecture and Layout

### Repository Structure

```
microsoft-authentication-library-for-js/
├── lib/                         # Core packages
│   ├── msal-common/             # Shared authentication logic
│   ├── msal-browser/            # Browser implementation  
│   ├── msal-node/               # Node.js implementation
│   ├── msal-react/              # React wrapper
│   └── msal-angular/            # Angular wrapper
├── extensions/                  # Additional libraries
│   └── msal-node-extensions/    # Token cache extensions
├── samples/                     # Example applications, End-to-end tests
├── shared-configs/              # Shared ESLint, Rollup configs
├── shared-test-utils/           # Common test utilities
├── .github/workflows/           # CI/CD pipelines
├── change/                      # Beachball change files
└── regression-tests/            # Performance benchmarks
```

### Key Configuration Files

- **Root `package.json`**: Defines workspaces and shared scripts
- **`tsconfig.json`**: TypeScript configuration
- **`.eslintrc.json`**: ESLint rules (per package)
- **`rollup.config.js`**: Bundle configuration (per package)
- **`jest.config.cjs`**: Test configuration (per package)
- **`api-extractor.json`**: API documentation config (per package)
- **`.beachballrc`**: Change file configuration

### GitHub Workflows and CI Checks

- **Beachball Check**: Validates change files on PRs to dev branch
- **Build Validation**: Ensures all packages build successfully
- **Performance Benchmarks**: Runs regression tests for msal-node

### Dependencies and Architecture

- **msal-common**: Core package - no dependencies on other MSAL packages
- **msal-browser**: Depends on msal-common
- **msal-node**: Depends on msal-common  
- **msal-react**: Depends on msal-browser and msal-common
- **msal-angular**: Depends on msal-browser and msal-common

**Build order dependency**: msal-common → msal-browser/msal-node → msal-react/msal-angular

### Code Standards

- Prefer simple constants over nested ones
- Prefer `const` objects with `as const` or literal types over TypeScript enums
- Prefer standalone functions over classes when possible
- Use `const` for immutable data
- Avoid complex type computations; prefer simple, readable type definitions
- Never make breaking, non-backwards compatible changes to libraries (breaking changes to samples are OK)
- Follow semantic versioning principles
- Write unit tests for new functionality and bug fixes
- Document all public API changes

### Telemetry and Performance Monitoring

**IMPORTANT: Add telemetry for any new operations or significant code paths in msal-browser and msal-common where observability would be useful.**

#### When to Add Telemetry

Add performance measurements for:
- New public API methods
- Significant internal operations (cache operations, network calls, crypto operations)
- Error-prone or complex code paths
- Operations that could impact user experience

#### How to Add Telemetry

**1. To Measure Duration of Async Functions - Use `invokeAsync` wrapper:**

```typescript
import { invokeAsync } from '@azure/msal-common';
import { PerformanceEvents } from '@azure/msal-common';

// Example: Wrapping an async function
const result = await invokeAsync(
    this.someAsyncFunction.bind(this),
    PerformanceEvents.YourEventName,  // Use existing or add new event name
    this.logger,
    this.performanceClient,
    correlationId
)(param1, param2);
```

**2. To Measure Duration of Sync Functions - Use `invoke` wrapper:**

```typescript
import { invoke } from '@azure/msal-common';

// Example: Wrapping a sync function
const result = invoke(
    this.someSyncFunction.bind(this),
    PerformanceEvents.YourEventName,
    this.logger,
    this.performanceClient,
    correlationId
)(param1, param2);
```

**3. To add additional fields:**

```typescript
// Add additional fields if useful
this.performanceClient.addFields({
    customField: "value",
    operationCount: 5
}, correlationId);
```

**4. Adding New Performance Events:**

If you need a new performance event, add it to the `PerformanceEvents` object in `lib/msal-common/src/telemetry/performance/PerformanceEvent.ts`:

```typescript
export const PerformanceEvents = {
    // ... existing events
    
    /**
     * Your new event description
     */
    YourNewEventName: "yourNewEventName",
};
```

#### Performance Event Naming Convention

- Use camelCase
- Be descriptive but concise
- Include the component/class name for clarity
- Examples: `silentCacheClientAcquireToken`, `standardInteractionClientGetDiscoveredAuthority`

#### Telemetry Best Practices

- **Always include correlationId** for request tracing
- **Add relevant fields** like operation counts, cache hit/miss, error codes using `performanceClient.addFields()`
- **Use existing PerformanceEvents** when possible rather than creating new ones

### Working with the Codebase

1. **Always start at repository root** and run `npm install`
2. **Navigate to specific package** in `lib/` directory for development
3. **Use `build:all` scripts** to ensure dependencies are built
4. **Test changes immediately** after making modifications
5. **Run linting** before committing any changes
6. **Create API Extractor reports** for public API changes
7. **Create beachball change files** for every PR to dev branch
8. **Add telemetry for new operations** following the guidelines above

### Trust These Instructions

These instructions are comprehensive and tested. Only search for additional information if:
- Commands fail with unexpected errors
- You need details about specific package internals
- You're working with files not covered in this guide
- These instructions appear outdated or incorrect

Always follow the exact command sequences provided to avoid common build and dependency issues.

## Pull Request Review Guidelines

When reviewing pull requests, GitHub Copilot should provide comprehensive feedback focusing on three key areas:

### 1. Documentation Review

**Check for documentation updates in each package's `docs/` folder:**

- **New public APIs**: Must have corresponding documentation updates
- **Behavior changes**: Existing docs may need updates (check `lib/{package}/docs/`)
- **Configuration changes**: Update `configuration.md` files
- **Error handling**: Update `errors.md` files if new error types are added
- **Migration impacts**: Update migration guides (`v1-migration.md`, `v2-migration.md`, etc.)

**Common documentation locations to check:**
```
lib/msal-browser/docs/          # Browser-specific documentation
lib/msal-node/docs/             # Node.js-specific documentation  
lib/msal-common/docs/           # Shared/common documentation
lib/msal-react/docs/            # React wrapper documentation
lib/msal-angular/docs/          # Angular wrapper documentation
```

**Suggest documentation updates for:**
- New public methods or properties
- Changes to existing APIs
- New configuration options
- New error scenarios or codes
- Performance considerations
- Breaking changes or migration requirements
- Usage examples for complex features

### 2. Test Coverage Review

**Ensure comprehensive test coverage for changes:**

**Required test types:**
- **Unit tests**: Every new function/method should have unit tests
- **Integration tests**: For complex flows or cross-component interactions
- **Error scenario tests**: Test error handling and edge cases
- **Regression tests**: For bug fixes, ensure the bug scenario is tested

**Test file locations:**
```
lib/{package}/test/             # Package-specific tests
samples/*/test/                 # Sample application tests
```

**Review test quality:**
- **Test completeness**: Cover success, failure, and edge cases
- **Test isolation**: Each test should be independent
- **Mocking**: Proper use of mocks for external dependencies
- **Assertions**: Verify both expected outcomes and side effects
- **Test naming**: Clear, descriptive test names

**Suggest additional tests for:**
- New public APIs (positive and negative cases)
- Changed error handling logic
- New configuration options and their validation
- Performance-critical code paths
- Security-sensitive operations (auth flows, token handling)

### 3. Telemetry and Observability Review

**Identify opportunities for additional telemetry:**

**High-priority areas for telemetry:**
- **New public APIs**: Should have performance measurements
- **Network operations**: HTTP requests, retries, timeouts
- **Cache operations**: Hits, misses, evictions
- **Cryptographic operations**: Key generation, signing, verification
- **Error scenarios**: Track error frequency and types
- **Performance bottlenecks**: Identify slow operations

**Suggest telemetry additions for:**
- New authentication flows or methods
- Changes to token acquisition logic
- New caching strategies or cache operations
- Error handling improvements
- Performance optimizations

**Review existing telemetry:**
- Ensure new code paths include appropriate `invokeAsync` or `invoke` wrappers
- Verify proper use of `PerformanceEvents` constants
- Check that error scenarios are properly instrumented
- Validate that correlationId is passed through telemetry calls

### PR Review Checklist

**For every PR, suggest checking:**

**Code Quality:**
- [ ] Follows TypeScript/JavaScript best practices
- [ ] Proper error handling with telemetry
- [ ] No breaking changes (unless major version)
- [ ] Follows existing code patterns and conventions

**Testing:**
- [ ] Unit tests for all new functionality
- [ ] Tests for error scenarios and edge cases
- [ ] Integration tests for complex features
- [ ] No decrease in test coverage

**Documentation:**
- [ ] Public API changes documented
- [ ] Configuration changes documented
- [ ] Migration guide updated if needed
- [ ] Examples provided for complex features

**Performance & Observability:**
- [ ] Performance measurements added for new operations
- [ ] Proper use of existing PerformanceEvents
- [ ] Error scenarios include telemetry
- [ ] No performance regressions

**Build & Validation:**
- [ ] All packages build successfully
- [ ] Tests pass in all affected packages  
- [ ] Linting passes
- [ ] API Extractor reports updated if needed
- [ ] Beachball change files included

**Specific Areas to Focus On:**

When reviewing, provide specific, actionable suggestions with code examples where helpful. Focus on maintainability, security, performance, and user experience.

### Code Suggestion Guidelines

#### Always Provide Code Suggestions When Applicable

**IMPORTANT: Use GitHub's code suggestion feature (i.e., suggestion code blocks) instead of plain text descriptions whenever possible.**

This allows PR authors to accept suggestions with a single click, making reviews more efficient.

#### When to Use Code Suggestions

**Always use code suggestions for:**
- Formatting issues (indentation, spacing, line breaks, JSON/YAML formatting)
- Simple fixes (typos, missing semicolons, incorrect imports)
- Standard patterns (changefile format, conventional commits, linting rules)
- Refactoring suggestions for small code blocks
- Any change that can be directly applied to the code

**Examples:**
- Changefile format issues → Provide corrected JSON as a suggestion
- Import statement errors → Suggest the correct import
- Formatting inconsistencies → Suggest properly formatted code
- Simple bug fixes → Suggest the fix

#### When to Use Text Comments

**Use text comments (not code suggestions) for:**
- Design discussions or architectural questions
- Multiple alternative approaches
- Questions requiring clarification from the author
- Complex changes requiring significant context or explanation
- Issues that span multiple files or locations

### Code Suggestion Best Practices

1. **Be specific**: Each suggestion should target a specific issue
2. **Include context**: Briefly explain why the change is needed
3. **Keep it simple**: Break complex changes into multiple suggestions
4. **Link documentation**: Reference relevant docs or standards when applicable
5. **Suggest liberally**: Code suggestions are easy to accept or decline
