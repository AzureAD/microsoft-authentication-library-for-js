---
applyTo: "**/custom_auth/**"
---

# Native Authentication Code Structure Guide

## Directory Structure

```
src/custom_auth/
├── CustomAuthActionInputs.ts            # Input types for authentication actions
├── CustomAuthConstants.ts               # Feature-wide constants and enums
├── CustomAuthPublicClientApplication.ts # Main SDK entry point
├── ICustomAuthPublicClientApplication.ts# Public API interface
├── UserAccountAttributes.ts             # User attribute types and utilities
├── index.ts                             # Barrel export file
├── configuration/
│   └── CustomAuthConfiguration.ts       # Configuration types and validation
├── controller/
│   ├── CustomAuthStandardController.ts  # Main business logic controller
│   └── ICustomAuthStandardController.ts # Controller interface
├── core/                                # Shared utilities and base classes
│   ├── CustomAuthAuthority.ts           # Authority logic and validation
│   ├── auth_flow/                       # Base auth flow classes and JIT components
│   │   └── jit/                         # JIT-specific auth flow components
│   │       ├── error_type/              # JIT error types
│   │       ├── result/                  # JIT result types
│   │       └── state/                   # JIT state types
│   ├── error/                           # Core error types and error codes
│   ├── interaction_client/              # Base interaction client classes
│   ├── network_client/                  # HTTP and API clients
│   ├── telemetry/                       # Telemetry and logging
│   └── utils/                           # Utility functions
├── get_account/                         # Account management flow
│   ├── auth_flow/                       # States, results, errors
│   └── interaction_client/              # Account-specific clients
├── operating_context/
│   └── CustomAuthOperatingContext.ts    # Operating context definition
├── reset_password/                      # Password reset flow
│   ├── auth_flow/                       # States, results, errors
│   └── interaction_client/              # Reset password clients
├── sign_in/                             # Sign-in flow
│   ├── auth_flow/                       # States, results, errors
│   └── interaction_client/              # Sign-in clients
└── sign_up/                             # Sign-up flow
    ├── auth_flow/                       # States, results, errors
    └── interaction_client/              # Sign-up clients
```

## File Naming Conventions

### Class Files

-   PascalCase for class names: `CustomAuthPublicClientApplication.ts`
-   Interface files prefixed with 'I': `ICustomAuthPublicClientApplication.ts`
-   Base classes suffixed with 'Base': `AuthFlowErrorBase.ts`

### Feature Folders

-   snake_case for folder names: `sign_in/`, `reset_password/`, `get_account/`
-   Consistent subfolder structure: `auth_flow/`, `interaction_client/`

### Test Files

-   Mirror source structure in `test/custom_auth/`
-   Test files suffixed with `.spec.ts`
-   Test utilities in `test_resources/` folder

## Component Relationships

### Entry Point → Controller → Client Chain

```
CustomAuthPublicClientApplication
    ↓ delegates to
CustomAuthStandardController
    ↓ creates via factory
SignInClient/SignUpClient/ResetPasswordClient
    ↓ uses
CustomAuthApiClient (composed of flow-specific API clients)
```

### State Machine Flow

```
Initial State → Action → New State → Result Object
    ↓
User checks result type (isPasswordRequired, isCodeRequired, etc.)
    ↓
User calls method on state object (submitPassword, submitCode, etc.)
    ↓
New State/Result returned
```

## Code Organization Patterns

### Flow-Specific Structure

Each authentication flow (sign_in, sign_up, reset_password) follows this pattern:

```
{flow_name}/
├── auth_flow/
│   ├── error_type/
│   │   └── {FlowName}Error.ts          # Flow-specific error types
│   ├── result/
│   │   ├── {FlowName}Result.ts         # Main flow result
│   │   └── {FlowName}*Result.ts        # Step-specific results
│   └── state/
│       ├── {FlowName}State.ts          # Base state class
│       ├── {FlowName}*State.ts         # Step-specific states
│       └── {FlowName}StateParameters.ts # State parameter interfaces
└── interaction_client/
    ├── {FlowName}Client.ts             # Main interaction client
    ├── parameter/
    │   └── {FlowName}Params.ts         # Client parameter types
    └── result/
        └── {FlowName}ActionResult.ts   # Client action result types
```

### Core Module Structure

```
core/
├── CustomAuthAuthority.ts             # Authority logic and validation
├── auth_flow/                          # Base auth flow classes and shared flow components
│   ├── AuthFlowErrorBase.ts            # Base error class for auth flows
│   ├── AuthFlowResultBase.ts           # Base result class for auth flows
│   ├── AuthFlowState.ts                # Base state class for auth flows
│   └── jit/                            # JIT-specific auth flow components
│       ├── error_type/                 # JIT error types
│       ├── result/                     # JIT result types
│       └── state/                      # JIT state types
├── error/                              # Core error types and error codes
│   ├── CustomAuthError.ts              # Base custom auth error
│   ├── CustomAuthApiError.ts           # API-specific errors
│   ├── HttpError.ts                    # HTTP-specific errors
│   ├── *Error.ts                       # Specific error types
│   └── *ErrorCodes.ts                  # Error code constants
├── interaction_client/                 # Base interaction client classes
│   ├── CustomAuthInteractionClientBase.ts # Base interaction client
│   ├── CustomAuthInterationClientFactory.ts # Client factory
│   └── jit/                            # JIT-specific interaction clients
│       ├── JitClient.ts                # JIT interaction client
│       ├── parameter/                  # JIT parameter types
│       └── result/                     # JIT result types
├── network_client/                     # HTTP and API clients
│   ├── custom_auth_api/                # API client implementations
│   │   ├── BaseApiClient.ts            # Base API client functionality
│   │   ├── CustomAuthApiClient.ts      # Main API client
│   │   ├── ICustomAuthApiClient.ts     # API client interface
│   │   ├── SignInApiClient.ts          # Sign-in API operations
│   │   ├── SignupApiClient.ts          # Sign-up API operations
│   │   ├── ResetPasswordApiClient.ts   # Reset password API operations
│   │   └── types/                      # API request/response types
│   └── http_client/                    # HTTP abstraction layer
│       ├── FetchHttpClient.ts          # Fetch-based HTTP client
│       └── IHttpClient.ts              # HTTP client interface
├── telemetry/                          # Telemetry and logging
│   └── PublicApiId.ts                  # Public API identifiers
└── utils/                              # Utility functions
    ├── ArgumentValidator.ts            # Input validation utilities
    └── UrlUtils.ts                     # URL manipulation utilities
```

## Interface Design Patterns

### Result Object Pattern

All operations return result objects with consistent interface:

```typescript
interface FlowResult {
    state: FlowState;
    data?: ResultData;
    error?: FlowError;

    // Status checking methods
    isCompleted(): boolean;
    isFailed(): boolean;
    isPasswordRequired(): boolean;
    isCodeRequired(): boolean;
    // ... other state checks
}
```

### State Object Pattern

State objects encapsulate flow logic and provide action methods:

```typescript
class FlowState {
    constructor(protected stateParameters: StateParameters) {}

    // Action methods that return new results
    submitPassword(password: string): Promise<FlowResult>;
    submitCode(code: string): Promise<FlowResult>;
    resendCode(): Promise<FlowResult>;
}
```

### Error Object Pattern

Error objects provide helper methods for common scenarios:

```typescript
class FlowError {
    constructor(public errorData: CustomAuthError) {}

    // Helper methods for actionable errors only
    isUserNotFound(): boolean;
    isInvalidPassword(): boolean;
    isInvalidCode(): boolean;
    // No helpers for internal/service errors
}
```

## Import/Export Patterns

### Barrel Exports

Main `index.ts` exports public API surface:

```typescript
// Public classes
export { CustomAuthPublicClientApplication } from "./CustomAuthPublicClientApplication";

// Public types
export type { SignInInputs, SignUpInputs } from "./CustomAuthActionInputs";

// Result types
export { SignInResult } from "./sign_in/auth_flow/result/SignInResult";

// State types (for type checking)
export { SignInPasswordRequiredState } from "./sign_in/auth_flow/state/SignInPasswordRequiredState";
```

### Internal Imports

-   Use relative imports for all internal dependencies within the custom_auth feature
-   Avoid circular dependencies through proper layering

## Extension Patterns

### Adding New Authentication Flow

1. Create flow folder: `new_flow/`
2. Implement auth_flow structure (states, results, errors)
3. Create interaction client
4. Add API client methods
5. Update controller with new flow method
6. Add entry point method
7. Export public types in index.ts

### Adding New Authentication Challenge

1. Create new state class extending base state
2. Add result type for the challenge
3. Update interaction client with challenge logic
4. Add API client methods if needed
5. Update state machine transitions
6. Add error types and helper methods

### Adding Shared Flow Support to Existing Flow

Shared flows (like MFA, auth method registration) can be integrated into existing flows using this pattern:

1. **Add shared flow client** to the existing flow's state parameters (e.g., `jitClient: JitClient` in `SignInStateParameters`)
2. **Add result checking methods** to the existing flow result (e.g., `isAuthMethodRegistrationRequired()`, `isRegistrationRequired()`)
3. **Update interaction client** to handle shared flow required responses and create shared flow states
4. **Reuse existing shared flow states** from `core/auth_flow/{shared_flow_name}/state/` (do not duplicate in flow folders)
5. **Add shared flow state types** to existing flow action results (e.g., adding `AuthMethodRegistrationRequiredState` in the `SignInResultState` to support JIT state)
6. **Update flow error types** to handle shared flow-related errors if needed
7. **Update flow state transitions** to handle shared flow completion and return control to the original flow

## Testing Structure

### Test Organization

```
test/custom_auth/
├── CustomAuthPublicClientApplication.spec.ts
├── controller/
├── core/
├── sign_in/
│   ├── auth_flow/
│   │   ├── state/
│   │   ├── result/
│   │   └── error_type/
│   └── interaction_client/
├── sign_up/
├── reset_password/
├── get_account/
├── integration_tests/              # End-to-end integration tests
└── test_resources/
    ├── TestModules.ts              # Shared test utilities
    ├── MockClients.ts              # Mock implementations
    └── TestData.ts                 # Test data constants
```

### Test File Patterns

-   One test file per source file
-   Group tests by method/functionality
-   Use descriptive test names explaining scenario
-   Follow AAA pattern (Arrange, Act, Assert)
