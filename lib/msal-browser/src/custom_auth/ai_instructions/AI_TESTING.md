# AI Testing Instructions for Custom Authentication

## Overview
This document provides detailed guidance for writing, organizing, and running tests for the Custom Authentication feature in MSAL Browser.

---

## Unit Tests

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

### Structure & Location
- All unit tests for Custom Authentication are located in `lib/msal-browser/test/custom_auth/` and its subfolders.
- Tests are organized to mirror the folder structure of the feature code in `src/custom_auth/` (e.g., `sign_in/`, `sign_up/`, `reset_password/`, `get_account/`, `controller/`, `core/`, etc.).
- Each major state, result, error, and client class has a dedicated test file (e.g., `SignInPasswordRequiredState.spec.ts`, `SignInError.spec.ts`).
- The `integration_tests` folder is reserved for integration tests and should not be used for unit tests.
- The `test_resources` folder is used for reusable test utilities, constants, and test configuration shared across tests.

### Coverage Target
- The target test coverage for this feature is **greater than 85%**. Use coverage reports to monitor and address any gaps.

### Best Practices
- Use Jest for all unit tests.
- Mock dependencies to isolate units under test, but **do not mock any components outside the native auth feature** (i.e., outside `custom_auth`). For such components, create real test objects as shown in `test_resources/TestModules.ts`.
- Follow Arrange-Act-Assert (AAA) structure for clarity.
- Test all public methods, state transitions, and error scenarios (including edge cases and invalid input).
- Ensure all error helper methods are covered.
- Keep tests deterministic and repeatable.
- Use descriptive test names and document complex scenarios in comments.

### Example Test File Structure
```text
lib/msal-browser/test/custom_auth/
  ├── CustomAuthPublicClientApplication.spec.ts
  ├── controller/CustomAuthStandardController.spec.ts
  ├── sign_in/auth_flow/state/SignInPasswordRequiredState.spec.ts
  ├── sign_in/auth_flow/state/SignInCodeRequiredState.spec.ts
  ├── sign_in/auth_flow/error_type/SignInError.spec.ts
  ├── sign_up/auth_flow/state/SignUpPasswordRequiredState.spec.ts
  ├── reset_password/auth_flow/state/ResetPasswordPasswordRequiredState.spec.ts
  ├── get_account/auth_flow/CustomAuthAccountData.spec.ts
  ├── core/utils/ArgumentValidator.spec.ts
  └── test_resources/TestModules.ts
```

### Running Unit Tests
To run all unit tests for Custom Authentication (and the full MSAL Browser project), use the following command from the project root:

```sh
cd lib/msal-browser && npm run test
```

This will execute all tests, including those in `lib/msal-browser/test/custom_auth/`. For focused development, you can use Jest's filtering options to run specific test files or folders.

---

## E2E Tests

*To be added.*