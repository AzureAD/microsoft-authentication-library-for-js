# AI Context File for MSAL Custom Authentication Project

## 📦 Description

MSAL Custom Authentication is a TypeScript-based library that extends Microsoft's Authentication Library (MSAL) to enable customized authentication experiences in modern web applications. Key features include:

-   **Flexible Authentication Flows:**

    -   Sign-in with username/password or passwordless options
    -   Sign-up with customizable user attributes
    -   Password reset and account recovery
    -   Account management and token handling

-   **UI Framework Agnostic:**

    -   Built as a headless authentication library
    -   Complete control over UI implementation
    -   Separation of authentication logic from presentation
    -   Seamless integration with any UI framework (React, Angular, Vue, vanilla JavaScript)

-   **Developer-Friendly:**
    -   Strongly typed APIs for enhanced development experience
    -   Comprehensive error handling and logging
    -   Built-in state management for auth flows
    -   Clear separation of concerns for better maintainability

## 🧱 Technology Stack

-   **Language & Runtime:**
    -   TypeScript 5.7+
    -   Node.js 10+
-   **Core Dependencies:**
    -   @azure/msal-browser - Core MSAL browser library
-   **Build System:**
    -   Rollup.js - Module bundling
    -   TypeScript compiler
    -   Babel - JavaScript compilation
-   **Testing & Quality:**
    -   Jest - Testing framework with JSDOM environment
    -   ESLint - Code linting
    -   Prettier - Code formatting
-   **Documentation:**
    -   TypeDoc - API documentation
    -   API Extractor - API report generation

## 🗂️ Structure

```
lib/msal-custom-auth/
  ├── src/                                          → Core library implementation
  │     ├── configuration/                          → Configuration related files
  │     ├── controller/                             → Controller implementation
  │     ├── core/                                   → Core functionality and errors
  │     │     ├── auth_flow/                        → Base authentication flow classes
  │     │     ├── error/                            → Error type definitions
  │     │     ├── interaction_client/               → Base interaction clients
  │     │     ├── network_client/                   → HTTP and API client implementations
  │     │     │     ├── custom_auth_api/            → Custom auth API clients
  │     │     │     └── http_client/                → HTTP client implementation
  │     │     ├── telemetry/                        → Telemetry implementations
  │     │     └── utils/                            → Utility functions
  │     ├── get_account/                            → Account retrieval functionality
  │     ├── operating_context/                      → Operating context implementation
  │     ├── reset_password/                         → Password reset flow
  │     ├── sign_in/                                → Sign-in flow implementation
  │     │     ├── auth_flow/                        → Sign-in authentication flow
  │     │     │     ├── error_type/                 → Sign-in specific errors
  │     │     │     ├── result/                     → Sign-in operation results
  │     │     │     └── state/                      → Sign-in flow states
  │     │     └── interaction_client/               → Sign-in interaction handling
  │     ├── sign_up/                                → Sign-up flow implementation
  │     │     ├── auth_flow/                        → Sign-up authentication flow
  │     │     │     ├── error_type/                 → Sign-up specific errors
  │     │     │     ├── result/                     → Sign-up operation results
  │     │     │     └── state/                      → Sign-up flow states
  │     │     └── interaction_client/               → Sign-up interaction handling
  │     ├── index.ts                                → Library entry point
  │     ├── CustomAuthPublicClientApplication.ts    → Main application class
  │     ├── CustomAuthActionInputs.ts               → Action input type definitions
  │     ├── CustomAuthConstants.ts                  → Constants definitions
  │     ├── ICustomAuthPublicClientApplication.ts   → Interface definitions
  │     ├── packageMetadata.ts                      → Package version information
  │     └── UserAccountAttributes.ts                → User account attributes
  ├── test/                                         → Unit tests
  ├── package.json                                  → Project dependencies and scripts
  ├── rollup.config.js                              → Build configuration
  ├── jest.config.cjs                               → Testing configuration
  └── typedoc.json                                  → Documentation generation config
```

## 🔁 Patterns & Conventions

### 📌 General

-   Always define classes and significant logic in separate TypeScript files under `src/core/`.
-   Public-facing APIs should be exposed through `src/index.ts`.
-   Avoid embedding complex logic directly within entry points or utility scripts.

### 📌 Async Method Handling

-   All methods interacting with network or authentication flows must be marked `async`.
-   Properly await promises and handle exceptions internally using try-catch.

```typescript
async signInUser(credentials): Promise<AuthenticationResult> {
  try {
    const result = await this.performAuthentication(credentials);
    return result;
  } catch (error) {
    logger.error("Sign-in error:", error);
    throw error;
  }
}
```

### 📌 Error Handling

-   Use centralized logging for all caught exceptions (`logger.error()` for errors).
-   Return standardized error objects to maintain consistency across API responses.

### 📌 Testing

-   Unit tests must be located under `/test` directory, following `.spec.ts` naming convention.
-   Maintain high test coverage, especially for core authentication flows.

## 🗝️ Key Files

-   `src/index.ts`: Exports all public classes, interfaces, types, and constants.
-   `src/CustomAuthPublicClientApplication.ts`: Main application class implementing custom authentication flows.
-   `src/ICustomAuthPublicClientApplication.ts`: Interface definition for the main application.
-   `src/CustomAuthActionInputs.ts`: Type definitions for authentication flow inputs.
-   `src/CustomAuthConstants.ts`: Shared constants used throughout the library.
-   `src/UserAccountAttributes.ts`: User account attribute management.
-   `src/configuration/`: Configuration and initialization related files.
-   `src/controller/`: Authentication flow controllers.
-   `src/core/`: Core error handling and utilities.
-   `src/get_account/`: Account retrieval and management.
-   `src/sign_in/`, `src/sign_up/`, `src/reset_password/`: Authentication flow implementations.
-   `package.json`: Manage dependencies and npm scripts.
-   `rollup.config.js`: Defines build steps.
-   `jest.config.cjs`: Testing framework setup.

## 🎯 Goals for Copilot / AI Tools

When modifying or extending authentication functionality:

-   Keep main application logic in `CustomAuthPublicClientApplication.ts` focused on high-level flow coordination.
-   Implement specific authentication flows in their dedicated directories (`sign_in/`, `sign_up/`, `reset_password/`).
-   Place shared utilities and error handling in `src/core/`.
-   Implement flow controllers in `src/controller/` to manage authentication state and operations.
-   Define new action inputs in `CustomAuthActionInputs.ts`.
-   Add any new constants to `CustomAuthConstants.ts`.
-   Export all public APIs through `src/index.ts`.
-   Write corresponding tests under `/test` folder immediately.
-   Ensure proper error handling using the error types defined in `src/core/error/`.
-   Follow established async patterns for all network and authentication operations.
-   Use type-safe interfaces and maintain strict type checking throughout the codebase.

## 📚 Reference Files

-   **Entry Point & Exports:** `src/index.ts`
-   **Main Application:** `src/CustomAuthPublicClientApplication.ts`, `src/ICustomAuthPublicClientApplication.ts`
-   **Authentication Flows:**
    -   `src/sign_in/`: Sign-in implementation
    -   `src/sign_up/`: Sign-up implementation
    -   `src/reset_password/`: Password reset implementation
    -   `src/get_account/`: Account management
-   **Core Implementation:**
    -   `src/controller/`: Authentication flow controllers
    -   `src/core/`: Error handling and utilities
    -   `src/configuration/`: Configuration management
    -   `src/operating_context/`: Operating context implementation
-   **Type Definitions & Constants:**
    -   `src/CustomAuthActionInputs.ts`: Action input types
    -   `src/UserAccountAttributes.ts`: User account attributes
    -   `src/CustomAuthConstants.ts`: Shared constants

> This context file is optimized for guidance of AI-driven coding tools like GitHub Copilot or ChatGPT, ensuring consistent implementation aligned with project standards.
