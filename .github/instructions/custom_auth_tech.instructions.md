---
applyTo: "**/custom_auth/**"
---

# Native Authentication Technical Standards

## Architecture Principles

### Layered Architecture

The Native Authentication feature follows a strict layered architecture:

1. **Entry Point Layer**: `CustomAuthPublicClientApplication` - Main SDK interface
2. **Controller Layer**: `CustomAuthStandardController` - Business logic coordination
3. **Interaction Client Layer**: Flow-specific clients (`SignInClient`, `SignUpClient`, etc.)
4. **Network Client Layer**: API communication (`CustomAuthApiClient`, flow-specific API clients)
5. **State/Result Layer**: State machine implementation and result objects

### State Machine Implementation

-   All authentication flows implemented as explicit state machines
-   State objects encapsulate logic and data for each step
-   Result objects wrap states and provide status checking methods
-   Immutable state transitions - never mutate existing state objects
-   Clear state type discrimination using TypeScript discriminated unions

## TypeScript Standards

### Type Safety Requirements

-   Explicit type definitions for all public APIs
-   Strict null checks enabled - avoid `any` type usage
-   Interface-based contracts for all public APIs
-   Discriminated unions for result types with multiple outcomes
-   Proper generic type constraints where applicable

### Code Organization

-   Use `as const` object types instead of enums for better tree shaking
-   Define constants as flat exports rather than nested objects
-   Prefer standalone functions over classes for utility functions
-   Use composition patterns over inheritance for flexibility

### Documentation Standards

-   JSDoc comments for public classes, methods, and types exposed to SDK users (exported from `index.ts`)
-   Internal classes and methods may have minimal documentation focused on maintainability
-   Clear parameter and return type documentation for public APIs
-   Usage examples in complex API documentation
-   Error handling patterns documented with examples

## Error Handling Standards

### Error Type Hierarchy

Two distinct error categories:

1. **Core Errors (Error type)**:

    - Located in `core/error/` folder
    - Extend from `AuthFlowErrorBase`
    - Used internally within SDK
    - Error codes defined in `*ErrorCodes.ts` files
    - Suberror codes defined in `SuberrorCodes.ts` for more specific error categorization

2. **Action/Result Errors (Non-Error type)**:
    - Located in respective feature folders
    - Part of `AuthFlowResultBase` result objects
    - Contain `errorData` property for detailed information
    - Provide helper methods for actionable errors only

### Error Propagation Rules

-   **Never throw errors from public SDK APIs**
-   All errors returned in result objects with error properties
-   Controllers and state objects must catch all errors and ensure no errors are thrown to SDK users
-   Network and interaction clients may throw errors internally, but these must be caught at controller/state boundaries
-   Helper methods only for user-actionable errors (validation, input errors)
-   Internal/service errors exposed only via `errorData` property

### Error Message Standards

-   Concise messages to minimize bundle size
-   No sensitive information in error messages
-   Actionable guidance where possible
-   Stable error codes for programmatic handling

## Network Client Standards

### API Client Architecture

-   Base `CustomAuthApiClient` composes flow-specific API clients
-   Each flow has dedicated API client (`SignInApiClient`, `SignupApiClient`, etc.)
-   Common HTTP operations abstracted in `BaseApiClient`
-   Consistent request/response handling patterns

### HTTP Standards

-   Use `IHttpClient` interface for all HTTP operations
-   Proper correlation ID handling in all requests
-   Consistent header management across requests
-   Structured error response handling

### Request/Response Types

-   Strongly typed request and response interfaces
-   Consistent naming conventions (`*Request`, `*Response`)
-   Proper validation of API responses
-   Error response standardization

## Testing Standards

### Unit Testing Requirements

-   **Target coverage: >85%**
-   Tests mirror source code folder structure
-   Each major class has dedicated test file
-   Mock dependencies within custom_auth feature only
-   Use real objects for external MSAL components

### Test Organization

-   Follow Arrange-Act-Assert (AAA) pattern
-   Descriptive test names explaining scenario
-   Test all public methods and state transitions
-   Cover all error scenarios and edge cases
-   Test all error helper methods

### Test Utilities

-   Shared test utilities in `test_resources/` folder
-   Reusable mock objects and test data
-   Common test configuration patterns
-   Helper functions for complex test scenarios

### Integration Testing Requirements

-   Integration tests located in `test/custom_auth/integration_tests/` folder
-   Test end-to-end authentication flows with mocked API responses
-   Validate complete user journeys across multiple components
-   Test error scenarios and edge cases in integrated environments
-   Mock API responses to simulate various authentication scenarios and error conditions

## Performance Standards

### Bundle Optimization

-   Support tree shaking and dead code elimination
-   Use dynamic imports for large/optional features
-   Minimize method and property names for better minification
-   Avoid patterns that prevent optimization

### Runtime Efficiency

-   Efficient state object creation and management
-   Minimal memory allocation in hot paths
-   Proper cleanup of resources and event listeners
-   Optimized network request patterns

## Development Workflow

### Build Requirements

All code must pass:

```bash
cd lib/msal-browser && npm run build:all
cd lib/msal-browser && npm run format:fix
cd lib/msal-browser && npm run lint
```

### Code Generation Patterns

When adding new authentication flows:

1. Add method to entry point and controller
2. Create new interaction client
3. Add state/result classes for each step
4. Update state machine logic
5. Add/extend network client methods
6. Create comprehensive tests
7. Update documentation

### Dependency Management

-   Request approval before adding new dependencies
-   Minimize external dependencies
-   Use existing MSAL Browser infrastructure where possible
-   Document dependency rationale

## Security Standards

### Token Handling

-   Secure token storage using MSAL Browser cache
-   Proper token expiration handling
-   Secure continuation token management
-   No tokens in error messages or logs

### Data Protection

-   No PII in error messages
-   Secure handling of user credentials
-   Proper request correlation for audit trails
-   Compliance with security best practices

### API Security

-   Validate all input parameters
-   Sanitize error messages
-   Proper HTTPS enforcement
-   Secure header management
