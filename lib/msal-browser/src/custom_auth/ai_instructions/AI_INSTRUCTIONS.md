# AI Instructions for Native Authentication

## 1. Feature Overview

The Native Authentication feature in the MSAL Browser SDK enables advanced, flexible authentication flows beyond standard OAuth/OpenID Connect protocols. This feature is designed to support modern authentication scenarios such as sign-in, sign-up, and self-service password reset, as well as robust token management after authentication.

Native Authentication is implemented as a set of modular, extensible components within the `msal-browser` SDK. It provides a public API surface for initiating and managing authentication flows, including:

- **Sign-in:** Initiate and complete user sign-in with support for multi-step challenges. Sign-in supports both username + password and username + email OTP (one-time password) scenarios.
- **Sign-up:** Register new users, handling required attributes, password setup, and verification codes. Sign-up supports both username + password and username + email OTP scenarios.
- **Self-service password reset:** Allow users to reset their passwords securely, including code verification and error handling.
- **Account management:** Retrieve and manage authenticated account information and tokens after sign-in.

The feature is built around the `CustomAuthPublicClientApplication` class, which exposes methods for each major flow (`signIn`, `signUp`, `resetPassword`, and `getCurrentAccount`). Each flow is designed to be extensible and robust, with clear result and error types, and support for additional authentication challenges as needed.

> **Note:** In this project, the term “Custom Authentication” is used in the codebase to avoid confusion with other features named “Native Authentication.” For all intents and purposes, “custom auth” in the code and “native authentication” in documentation refer to the same capability.

This architecture ensures that both AI agents and human developers can easily extend, maintain, and integrate advanced authentication scenarios into applications using the MSAL Browser SDK.

## 2. Folder Structure

```
src/custom_auth/
├── CustomAuthActionInputs.ts            # Input types for authentication actions (sign-in, sign-up, reset password, etc.)
├── CustomAuthConstants.ts               # Constants used throughout authentication flows (grant types, challenge types, etc.)
├── CustomAuthPublicClientApplication.ts # Main entry point; exposes the public API for native authentication flows
├── ICustomAuthPublicClientApplication.ts# Interface for the public client application API
├── UserAccountAttributes.ts             # Types and utilities for handling user account attributes
├── index.ts                             # Barrel file for exporting main modules and types
├── configuration/
│   └── CustomAuthConfiguration.ts       # Configuration options for native authentication
├── controller/
│   ├── CustomAuthStandardController.ts  # Implements the main controller logic
│   └── ICustomAuthStandardController.ts # Interface for the controller
├── core/                                # Core utilities, error handling, and shared logic
│   ├── AuthFlowErrorBase.ts             # Base class for flow errors
│   ├── AuthFlowResultBase.ts            # Base class for flow results
│   ├── AuthFlowState.ts                 # Base class for flow states
│   ├── CustomAuthAuthority.ts           # Authority logic and validation for native authentication
│   ├── error/                           # Custom error types and codes
│   ├── interaction_client/              # Base classes and factories for interaction clients
│   ├── network_client/                  # HTTP and network utilities
│   ├── telemetry/                       # Telemetry and logging utilities
│   └── utils/                           # General utility functions
├── get_account/                         # Account retrieval and management
│   ├── CustomAuthAccountData.ts         # Data structure for account info
│   ├── auth_flow/                       # States, results, and errors for account retrieval
│   └── interaction_client/              # Clients for account-related interactions
├── operating_context/
│   └── CustomAuthOperatingContext.ts    # Defines the operating context for authentication flows
├── reset_password/                      # Self-service password reset logic
│   ├── auth_flow/                       # States, results, and errors for password reset
│   └── interaction_client/              # Clients for password reset interactions
├── sign_in/                             # Sign-in flow logic
│   ├── auth_flow/                       # States, results, and errors for sign-in
│   └── interaction_client/              # Clients for sign-in interactions
└── sign_up/                             # Sign-up (registration) flow logic
    ├── auth_flow/                       # States, results, and errors for sign-up
    └── interaction_client/              # Clients for sign-up interactions
```

## 3. Project Layers

The Native Authentication feature is composed of several core components that work together to provide extensible authentication flows. Understanding these components and their relationships will help guide where to generate new code for future features:

- **Entry Point: `CustomAuthPublicClientApplication`**
  - Main class exposed to consumers. Provides public methods for each authentication flow: `signIn`, `signUp`, `resetPassword`, and `getCurrentAccount`.
  - Each method delegates to a controller for business logic.

- **Controller: `CustomAuthStandardController`**
  - Acts as the bridge between the entry point (`CustomAuthPublicClientApplication`) and interaction clients.
  - Receives input from the entry point, validates and prepares flow context, and delegates execution to the appropriate interaction client for each authentication operation.
  - Manages state transitions and result objects, ensuring all flows follow project architecture and error handling patterns.

- **Interaction Clients (e.g., `SignInClient`, `SignUpClient`, `ResetPasswordClient`)**
  - Encapsulate logic for interacting with the user and handling each step of the authentication process.
  - Are used by both the controller and state/result objects to perform the actual logic for each authentication step, enabling the state machine pattern and supporting multi-step flows.
  - Created via the `CustomAuthInterationClientFactory`.
  - Handle multi-step flows, such as sending codes, verifying passwords, and managing continuation tokens.

- **Network Clients (e.g., `CustomAuthApiClient`, `SignInApiClient`, `SignupApiClient`, `ResetPasswordApiClient`)**
  - Responsible for making HTTP requests to backend authentication APIs.
  - Used by interaction clients to perform server-side operations (e.g., validating credentials, sending OTPs).
  - Each flow-specific API client (e.g., `SignInApiClient`, `SignupApiClient`, `ResetPasswordApiClient`) implements the endpoints and logic for its respective flow, and is composed into `CustomAuthApiClient`.
  - When adding a new interaction client and corresponding network logic (e.g., `RegisterApiClient`), implement the new API client in the appropriate feature folder under `core/network_client/`, and expose its operations through `CustomAuthApiClient` to maintain a consistent and centralized network layer.

- **State and Result Classes (e.g., `SignInState`, `SignInResult`, `SignUpState`, `ResetPasswordStartResult`)**
  - Represent the current state of an authentication flow and the result of each operation.
  - Result objects (e.g., `SignInResult`, `SignUpResult`) wrap state objects (e.g., `SignInState`, `SignUpState`) and expose methods to check the flow status and access the next actionable state.
  - State objects encapsulate the logic and data for each step, providing methods to advance the flow (e.g., `submitPassword`, `submitCode`).

### State Machine Design Pattern

This feature uses the state machine design pattern. Each authentication flow is modeled as a series of states and transitions. After each action, the SDK returns a state/result object that represents the current step. The consumer can then invoke the next appropriate method on the state object to continue the flow. This pattern ensures that complex, multi-step authentication processes are handled in a structured, extensible, and predictable way, making it easier to add new steps or handle new scenarios in the future.

### Call Chain Example (Sign-In Flow)

1. Consumer calls `signIn()` on `CustomAuthPublicClientApplication`.
2. Delegates to `CustomAuthStandardController.signIn()`.
3. Controller uses `CustomAuthInterationClientFactory` to create a `SignInClient`.
4. `SignInClient` interacts with the user and calls the appropriate `CustomAuthApiClient` methods to communicate with the backend.
5. State and result objects are created and returned at each step to represent progress and outcomes.
6. If the result's state indicates that a code is required (e.g., multi-factor authentication), the SDK user will interact with the returned state object to submit the code or request a resend (e.g., by calling `submitCode()` or `resendCode()` on the state object).
7. Each user action (such as submitting a code or password) triggers a new step in the state machine, with updated state and result objects returned to represent the next required action or the completion of the flow.
8. This process repeats until the sign-in flow is completed and a final result is returned, indicating success or failure.

## 4. Error Handling

Robust error handling is essential for a secure and user-friendly authentication experience. The Native Authentication feature uses a structured approach to error handling, ensuring that all errors are predictable, actionable, and well-documented.

### Error Types and Hierarchy
- There are two types of error classes in this feature:
  1. **Core Errors (Error type):**
     - Placed in the `core/error` folder.
     - Extend from a common base class such as `AuthFlowErrorBase` (see `core/AuthFlowErrorBase.ts`).
     - Can be thrown at the point of failure and are used internally within the SDK.
     - Error codes for these errors should be defined in dedicated files named `*ErrorCodes.ts` (e.g., `HttpErrorCodes.ts`) in the appropriate location.
  2. **Action/Result Errors (Non-Error type):**
     - Placed in their respective feature folders (e.g., `sign_up/auth_flow/error_type/SignUpError.ts`).
     - These are not JavaScript `Error` types, but are part of the `AuthFlowResultBase` result objects returned to SDK users.
     - Contain an `errorData` property, which is propagated up the call chain and provides detailed error information.
     - Provide a set of helper methods (e.g., `isUserAlreadyExists`, `isInvalidPassword`) to help SDK users easily check for common, actionable errors caused by their own input or actions.
     - Only provide such helper methods for errors that SDK users can act on (e.g., validation or user-actionable errors). For internal/service errors, only expose the error via `errorData` without helper methods.
     - These helper methods are designed to make error handling self-discoverable and ergonomic for SDK users.

### Error Propagation and API Contracts
- Errors of the `Error` type may be thrown internally by core, interaction, network clients, or controllers, but **no SDK API that is directly consumable by SDK users (e.g., methods on `CustomAuthPublicClientApplication` or state/result objects) should ever throw**.
- All SDK APIs must return result objects that include an error property (if an error occurred). SDK users should check the error in the result, not use try/catch.
- Controllers, interaction clients, and network clients must catch all errors and ensure they are included in the returned result object, never thrown to the SDK user.
- All public API methods must document possible error types and expected error handling patterns.

### Error Codes and Messages
- Use well-defined, stable error codes for all public-facing errors. Error codes should be defined in dedicated files named `*ErrorCodes.ts` (e.g., `HttpErrorCodes.ts`).
- Provide clear, actionable error messages for both developers and end users. **Messages should be as short as possible to minimize package size.**
- Avoid leaking sensitive information in error messages.

### Best Practices
- Always handle errors at flow boundaries (e.g., when transitioning between states in the state machine).
- Prefer returning error result objects over throwing exceptions for recoverable errors in multi-step flows.
- Document all error types and handling strategies in both code and user-facing documentation.
- Add unit tests for all error scenarios, including edge cases and backend failures.

### Example
```typescript
// SDK user does NOT need try/catch for SDK APIs:
const result = await customAuthApp.signUp(signUpInput);
if (result.error) {
    if (result.error.isUserAlreadyExists()) {
        // Handle user already exists
    } else if (result.error.isInvalidPassword()) {
        // Handle invalid password
    } else {
        // Handle other errors, possibly using errorData
        logError(result.error.errorData);
    }
} else {
    // Proceed with next step
}
```

---

## 5. Development Commands

All commands below should be run from the `lib/msal-browser` directory:

### Build
```
cd lib/msal-browser && npm run build
```

### Format
```
cd lib/msal-browser && npm run format:fix
```

### Lint
```
cd lib/msal-browser && npm run lint
```

## 6. Testing Requirements
See [AI_TESTING.md](./AI_TESTING.md) for detailed testing requirements, strategies, and examples.

## 7. AI-Specific Instructions
- When requirements are unclear, design code to be easily extensible and maintainable for future changes.
- Always maintain backward compatibility; do not introduce breaking changes.
- If any requirement is ambiguous or conflicts with existing standards, request clarification before proceeding.
- Use TypeScript best practices and follow the MSAL Browser code style.
- Explicitly define all TypeScript types and use type inference where it improves clarity and safety.
- Use interfaces and type aliases to establish clear, stable contracts for all public APIs.
- Favor composition patterns over inheritance to maximize code flexibility and reuse.
- Document all public classes, methods, and types thoroughly using JSDoc comments.
- Enable and use strict null checks; avoid using `any` unless absolutely necessary and justified.
- Before adding a new dependency, request and document approval to ensure minimal and justified dependencies.
- Define constants as simple, flat exports rather than nested objects to improve minification and tree shaking.
- Use `as const` object types instead of enums to minimize bundle size and improve type safety.
- Prefer standalone functions over classes for new features to maximize tree shaking and minification.
- If classes are required, keep method and property names concise, and refactor static methods to standalone functions when possible.
- Use dynamic imports for large or rarely used features to optimize initial bundle size and loading performance.
- Write code that supports tree shaking and minification; avoid patterns that prevent dead code elimination.

### Guidance for Code Generation for Native Auth Feature

When generating or updating code for the Native Authentication feature, follow these actionable guidelines to ensure maintainability, extensibility, and alignment with project standards:

- **Respect the Layered Architecture:**
  - Place new logic in the correct layer (entry point, controller, interaction client, network client, state/result, etc.).
  - Do not bypass the controller or interaction client layers when adding new flows or features.

- **State Machine Flows:**
  - Model all multi-step authentication flows as explicit state machines.
  - Each user action should return a new state/result object, never mutate state in place.
  - Add new states and transitions in a way that does not break or alter existing flows.

- **Extensibility:**
  - When adding new authentication challenges or steps, create new state/result classes and update the relevant interaction client and controller logic.
  - Use factory patterns for creating new interaction/network clients.
  - Avoid hard-coding flow logic; use configuration and extensible patterns where possible.

- **Type Safety and Contracts:**
  - Define all new public types, interfaces, and result objects in a dedicated file or folder.
  - Use discriminated unions for result types when multiple outcomes are possible.

- **Code Generation Patterns:**
  - When generating new flows, always:
    1. Add a new method to the entry point and controller.
    2. Create a new interaction client (or extend an existing one if appropriate).
    3. Add new state/result classes for each step.
    4. Update the state machine logic to handle new transitions.
    5. Add/extend network client methods as needed.
    6. Add or update tests and documentation.

- **Review and Validation:**
  - After generating code, run the build, lint, and format scripts as described in section [Development Commands](#4-development-commands) of this document, and ensure any errors or issues raised by these scripts are fixed before proceeding.
  - If any ambiguity remains, request clarification or add a TODO comment with a clear description of the open question.

- **Error Handling:**
    - Always follow the error handling patterns described in [Section 4. Error Handling](#4-error-handling):
        - Never throw errors from public SDK APIs; always return errors in result objects.
        - Implement and use helper error check methods for actionable errors in result objects.
        - Structure error types and error codes as documented, and ensure error messages are concise.

> **Tip:** When in doubt, prefer explicit, modular, and well-documented code that is easy for both AI and human contributors to extend and maintain.

## 8. Sample Code: Sign-In Flow

Below is a sample implementation of a sign-in flow using the Native Authentication (Custom Auth) feature in the MSAL Browser SDK. This example demonstrates best practices for using the state machine, handling errors, and working with result objects. It is suitable for both AI and human contributors as a reference for correct usage and extensibility.

> **Note:** This sample is simplified for clarity. In a real application, you would connect these steps to your UI (forms, buttons, etc.) and manage state accordingly.

```typescript
import {
    CustomAuthPublicClientApplication,
    SignInPasswordRequiredState,
    SignInCodeRequiredState,
    SignInCompletedState,
    AuthFlowStateBase,
    CustomAuthAccountData,
    SignInResult,
} from "@azure/msal-browser/custom-auth";
import { customAuthConfig } from "./config/auth-config";

async function signInFlow(username: string, password?: string, code?: string): Promise<CustomAuthAccountData | undefined> {
    // 1. Create the client
    const client = await CustomAuthPublicClientApplication.create(customAuthConfig);

    // 2. Start the sign-in process
    let result: SignInResult = await client.signIn({ username });

    // 3. Handle possible states
    if (result.isFailed()) {
        // Handle errors using helper methods and errorData
        if (result.error?.isUserNotFound()) {
            showError("User not found");
        } else if (result.error?.isInvalidUsername()) {
            showError("Invalid username");
        } else if (result.error?.isPasswordIncorrect()) {
            showError("Password is invalid");
        } else if (result.error?.isRedirectRequired()) {
            // Fallback to delegated authentication (e.g., popup)
            await handleDelegatedAuth(client);
        } else {
            showError(result.error?.errorData?.errorDescription || "Sign-in failed");
        }
        return;
    }

    // 4. Password required state
    if (result.isPasswordRequired()) {
        const submitPasswordResult = await result.state.submitPassword(password!);
        if (submitPasswordResult.isFailed()) {
            if (submitPasswordResult.error?.isInvalidPassword()) {
                showError("Incorrect password");
            } else {
                showError(submitPasswordResult.error?.errorData?.errorDescription || "Password verification failed");
            }
            return;
        }
    }

    // 5. Code required state (e.g., OTP)
    if (result.isCodeRequired()) {
        const submitCodeResult = await state.submitCode(code!);
        if (submitCodeResult.isFailed()) {
            if (submitCodeResult.error?.isInvalidCode()) {
                showError("Invalid code");
            } else {
                showError(submitCodeResult.error?.errorData?.errorDescription || "Code verification failed");
            }
            return;
        }
    }

    // 6. Completed state
    if (result.isCompleted()) {
        // Success! Access account data
        const account: CustomAuthAccountData = result.data;
        showSuccess(`Signed in as ${account.getAccount().username}`);
        return account;
    }

    // 7. Handle any other unexpected state
    showError("Unexpected sign-in state");
    return;
}

function showError(message: string) {
    // Display error to user (implement as needed)
    console.error(message);
}

function showSuccess(message: string) {
    // Display success to user (implement as needed)
    console.log(message);
}

async function handleDelegatedAuth(client: CustomAuthPublicClientApplication) {
    // Example fallback for delegated authentication (e.g., popup)
    // See the Error Handling and State Machine sections for details
    // ...
}
```

**Key Points:**
- The flow always checks `result.error` and uses helper methods for actionable errors (see [Error Handling](#4-error-handling)).
- No errors are thrown to the user; all errors are returned in result objects.
- The state machine pattern is followed: each step returns a new state/result, and the next action is determined by the state type.
- This pattern is extensible: to add new challenges (e.g., CAPTCHA), add new state/result classes and update the flow accordingly.
- For a full UI, connect each state to a form or component and collect user input as needed.

For more advanced flows (e.g., passwordless, sign-up, or reset password), follow the same state/result/error handling patterns as shown above.


