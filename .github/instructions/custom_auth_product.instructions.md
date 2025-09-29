---
applyTo: "**/custom_auth/**"
---

# Native Authentication Product Requirements

## Feature Overview

The Native Authentication (Custom Auth) feature in MSAL Browser SDK provides advanced, flexible authentication flows beyond standard OAuth/OpenID Connect protocols. This feature enables modern authentication scenarios including sign-in, sign-up, self-service password reset, and comprehensive account management.

## Core Capabilities

### Authentication Flows

-   **Sign-in Flow**: Username + password and username + email OTP scenarios with multi-step challenge support
    -   Multi-factor authentication (MFA) integration with method selection and verification
    -   Challenge-based verification (OTP, email codes) as part of sign-in process
    -   Support for multiple authentication methods during sign-in
-   **Sign-up Flow**: User registration with required attributes, password setup, and verification codes
-   **Password Reset Flow**: Self-service password reset with secure code verification
-   **Account Management**: Token retrieval, account information access, and sign-out functionality

### Glossary / Definitions

-   Authentication Method: A credential or verification mechanism (password, email OTP; future: SMS OTP, MFA app, passkey).
-   Challenge: A server-directed verification step required before completion.
-   Continuation Token: Opaque, short‑lived string from service enabling the next challenge step; treated as a credential and never persisted.
-   JIT (Just‑In‑Time) Registration/Enrollment: Additional mandatory step injected mid flow (e.g., required MFA setup or profile attribute capture) before completion.
-   Actionable Error: Error category that can be resolved through user input or alternate flow (e.g., invalid password, user not found).
-   Terminal State: A completed or failed result; no further actions allowed.

## User Experience Requirements

### State Machine Pattern

-   All authentication flows must follow a predictable state machine pattern
-   Each user action returns a new state/result object representing the current step
-   Users can determine next actions based on state type (password required, code required, completed, etc.)
-   No state mutation in place - always return new state objects

### Error Handling

-   No exceptions thrown to SDK users - all errors returned in result objects
-   Helper methods for common, actionable errors (e.g., `isUserNotFound()`, `isInvalidPassword()`)
-   Clear, concise error messages that don't leak sensitive information
-   Structured error data for programmatic handling

### API Design Principles

-   Self-discoverable APIs with intuitive method names
-   Consistent result patterns across all flows
-   Extensible design for future authentication challenges
-   Backward compatibility maintained across updates

## Security Requirements

### Token Management

-   Secure token storage and retrieval
-   Automatic token refresh when possible
-   Proper token expiration handling
-   Support for custom scopes and claims

### Data Protection

-   No sensitive information in error messages
-   Secure handling of continuation tokens
-   Proper correlation ID management for request tracking
-   Compliance with security best practices

## Integration Requirements

### SDK Integration

-   Seamless integration with the current `@azure/msal-browser` public APIs.
-   Compatible with standard MSAL configuration patterns
-   Support for custom authority configurations
-   Proper telemetry and logging integration

### Browser Compatibility

-   Support for modern browser environments
-   Proper handling of network requests and responses
-   Optimized bundle size with tree shaking support
-   Dynamic imports for optional features

## Extensibility Requirements

### Future Enhancements

-   Pluggable architecture for new authentication methods
-   Support for additional challenge types (SMA, Passkey, etc.)
-   Configurable flow customization
-   Integration points for custom validation logic

### Developer Experience

-   Comprehensive TypeScript support
-   Clear documentation and examples
-   Consistent patterns across all flows
-   Easy debugging and troubleshooting capabilities

## Usage Examples

### Sign-In Flow Example

Below is a sample implementation demonstrating how SDK users should interact with the Native Authentication feature. This example shows the complete sign-in flow including state machine usage, error handling, and result processing.

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

async function signInFlow(
    username: string,
    password?: string,
    code?: string
): Promise<CustomAuthAccountData | undefined> {
    // 1. Create the client
    const client = await CustomAuthPublicClientApplication.create(
        customAuthConfig
    );

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
            showError(
                result.error?.errorData?.errorDescription || "Sign-in failed"
            );
        }
        return;
    }

    // 4. Password required state
    if (result.isPasswordRequired()) {
        const submitPasswordResult = await result.state.submitPassword(
            password!
        );
        if (submitPasswordResult.isFailed()) {
            if (submitPasswordResult.error?.isInvalidPassword()) {
                showError("Incorrect password");
            } else {
                showError(
                    submitPasswordResult.error?.errorData?.errorDescription ||
                        "Password verification failed"
                );
            }
            return;
        }
    }

    // 5. Code required state (e.g., OTP)
    if (result.isCodeRequired()) {
        const submitCodeResult = await result.state.submitCode(code!);
        if (submitCodeResult.isFailed()) {
            if (submitCodeResult.error?.isInvalidCode()) {
                showError("Invalid code");
            } else {
                showError(
                    submitCodeResult.error?.errorData?.errorDescription ||
                        "Code verification failed"
                );
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

### Key Usage Patterns

#### State Machine Interaction

-   Each authentication step returns a new state/result object
-   Use type-safe state checking methods (`isPasswordRequired()`, `isCodeRequired()`, `isCompleted()`)
-   Never mutate state objects - always work with returned results
-   Handle all possible states in your flow logic

#### Error Handling Approach

-   Always check `result.error` before proceeding with success logic
-   Use helper methods for common errors (`isUserNotFound()`, `isInvalidPassword()`)
-   Access detailed error information via `errorData` property
-   No try/catch needed - all errors returned in result objects

#### Multi-Step Flow Management

-   Start with initial authentication call (`client.signIn()`)
-   Progress through states by calling methods on state objects (`submitPassword()`, `submitCode()`)
-   Each step can potentially return error, continuation, or completion states
-   Handle state transitions gracefully with appropriate UI updates

#### Account Data Access

-   Successful authentication returns `CustomAuthAccountData`
-   Access user information via `account.getAccount()`
-   Retrieve tokens and manage authentication state
-   Use account data for subsequent API calls and user experience

### Implementation Notes

-   This sample is simplified for clarity - connect to your UI components as needed
-   For production use, implement proper loading states and user feedback
-   Consider implementing retry logic for network failures
-   Add appropriate logging and telemetry for debugging
-   Follow the same patterns for sign-up and password reset flows
