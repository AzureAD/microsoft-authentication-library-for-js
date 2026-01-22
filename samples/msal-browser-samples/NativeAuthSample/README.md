# MSAL Native Auth Sample

This sample demonstrates how to use the Native Authentication capabilities of the Microsoft Authentication Library (MSAL) for JavaScript in a browser environment. Native Authentication provides a customizable and secure way to implement authentication flows including sign-in, sign-up, password reset, multi-factor authentication (MFA), and just-in-time (JIT) registration.

## 🚀 Getting Started

### Prerequisites
- Ensure [all pre-requisites](../../../lib/msal-browser/README.md#prerequisites) have been completed to run `@azure/msal-browser`.
- Install node.js if needed (<https://nodejs.org/en/>).

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Build the MSAL browser package**:
   ```bash
   cd ../../../lib/msal-browser && npm run build:all
   ```

3. **Build the MSAL node package**:
   ```bash
   cd ../../../lib/msal-node && npm run build:all
   ```

### Configuration

1. **Set up environment variables**:
   ```bash
   ./gen_env_native_auth.ps1
   ```

2. **Configure the application**:
   
   The application uses `nativeAuthConfig.json` for configuration. Key settings include:
   - `native_auth.tenant_subdomain`: Your tenant subdomain
   - `native_auth.tenant_id`: Your tenant ID
   - Client IDs for different authentication flows
   - Test user credentials

3. **Configure authentication flows in `app/authConfig.js`**:
   ```javascript
   const msalConfig = {
     customAuth: {
       challengeTypes: ["password", "oob", "redirect"],
       authApiProxyUrl: "YOUR_AUTH_PROXY_URL",
     },
     auth: {
       clientId: "YOUR_CLIENT_ID",
       authority: "https://YOUR_TENANT.ciamlogin.com",
       redirectUri: "/",
     },
     // Additional configuration...
   };
   ```

### Running the Application

1. **Start the development server**:
   ```bash
   npm start -- --port 30670 --sample nativeAuthSample
   ```
   By default, the server runs on `http://localhost:30670`

2. **Start the CORS proxy** (if needed):
   ```bash
   node cors.js --tenantSubdomain YOUR_SUBDOMAIN --tenantId YOUR_TENANT_ID --port 30001
   ```

## 🔧 Authentication Flow Configuration

The application behavior is controlled by URL query parameters:

| Configuration | URL Parameter | Description |
|---------------|---------------|-------------|
| **Email + Password** | `?usePwdConfig=true` | Basic email and password authentication |
| **Email + OTP** | `?useOtpConfig=true` | Email with one-time password |
| **Email + Password with Attributes** | `?usePwdAttributesConfig=true` | Sign-up with user attributes collection |
| **Email + OTP with Attributes** | `?useOtpAttributesConfig=true` | OTP flow with user attributes |
| **Multi-Factor Authentication** | `?usePwdConfig=true&useMFA=true` | Enable MFA requirement |
| **Redirect Scenario** | `?useOtpConfig=true&useRedirectConfig=true` | Force redirect-only flows |

### Example URLs:
```
http://localhost:30670/?usePwdConfig=true              # Email + Password
http://localhost:30670/?useOtpConfig=true              # Email + OTP  
http://localhost:30670/?usePwdConfig=true&useMFA=true  # With MFA
```


## Project Structure

The sample application is organized into the following structure:

```
NativeAuthSample/
├── app/                           # Main application source
│   ├── app.js                     # Main application logic
│   ├── authConfig.js              # MSAL configuration
│   ├── configParser.js            # Configuration parsing utilities
│   ├── index.html                 # Application entry point
│   ├── styles.css                 # Application styles
│   ├── flows/                     # Authentication flow implementations
│   │   ├── resetPassword/         # Password reset flow
│   │   │   ├── index.js
│   │   │   ├── ResetPasswordEventCoordinator.js
│   │   │   └── ResetPasswordUIManager.js
│   │   ├── signin/                # Sign-in flow  
│   │   │   ├── index.js
│   │   │   ├── SignInEventCoordinator.js
│   │   │   └── SignInUIManager.js
│   │   └── signup/                # Sign-up flow
│   │       ├── index.js
│   │       ├── SignUpEventCoordinator.js
│   │       └── SignUpUIManager.js
│   ├── shared/                    # Shared components
│   │   ├── BaseEventCoordinator.js
│   │   ├── jit/                   # Just-In-Time registration components
│   │   │   ├── AuthMethodChallengeForm.js
│   │   │   ├── AuthMethodSelectionForm.js
│   │   │   └── JitAuthHandlers.js
│   │   └── mfa/                   # Multi-Factor Authentication components
│   │       ├── MfaAuthHandlers.js
│   │       ├── MfaChallengeForm.js
│   │       └── MfaMethodSelectionForm.js
│   └── ui/                        # UI management utilities
│       ├── CodeVerificationManager.js
│       ├── FormManager.js
│       └── ui.js
├── test/                          # E2E test suite
│   ├── context/                   # Test documentation
│   │   ├── APP_FLOW_REFERENCE.md  # Complete application flow guide
│   │   └── TEST_IMPLEMENTATION_GUIDE.md # Testing patterns & best practices
│   ├── utils/                     # Test utilities and helpers
│   │   ├── configUtils.ts
│   │   ├── emailProviderUtils.ts
│   │   ├── proxyUtils.ts
│   │   └── testUtils.ts
│   ├── screenshots/               # Test execution screenshots
│   ├── jit.spec.ts               # Just-In-Time registration tests
│   ├── mfa.spec.ts               # Multi-Factor Authentication tests
│   ├── resetpassword.spec.ts     # Password reset tests
│   ├── signin.spec.ts            # Sign-in flow tests
│   ├── signout.spec.ts           # Sign-out flow tests
│   ├── signup.spec.ts            # Sign-up flow tests
│   └── nativeAuthConfig.json     # Test configuration
├── cors.js                       # CORS proxy server
├── gen_env_native_auth.ps1       # Environment setup script
├── jest.config.cjs               # Jest test configuration
├── nativeAuthConfig.json         # Application configuration
├── package.json                  # Project dependencies and scripts
├── server.js                     # Development server
├── tsconfig.json                 # TypeScript configuration
└── test-results.xml             # Test execution results
```

## E2E Testing

### Running Tests

1. **Set up environment variables**

   Execute the environment setup script:
   ```bash
   ./gen_env_native_auth.ps1
   ```

2. **Run all E2E tests**

   ```bash
   npm run test:e2e
   ```

3. **Run specific test files**

   ```bash
   # Run individual test files
   npm run test:e2e './test/jit.spec.ts'
   npm run test:e2e './test/signin.spec.ts'
   npm run test:e2e './test/signup.spec.ts'
   npm run test:e2e './test/resetpassword.spec.ts'
   npm run test:e2e './test/mfa.spec.ts'
   npm run test:e2e './test/signout.spec.ts'
   ```

### Test Documentation

- [`APP_FLOW_REFERENCE.md`](test/context/APP_FLOW_REFERENCE.md) - Complete application flow documentation
- [`TEST_IMPLEMENTATION_GUIDE.md`](test/context/TEST_IMPLEMENTATION_GUIDE.md) - Testing patterns and best practices

### Debugging Tests Locally

For debugging purposes, you can add console logging to capture browser console output during test execution. Add the following code in your test's `beforeEach` block:

```javascript
page.on("console", (msg) => {
   const type = msg.type();
   const text = msg.text();
   console.log(`[Browser ${type}]:`, text);
});
```

This will output all browser console messages (including errors, warnings, and logs) to your test runner console, making it easier to debug issues during test development and execution.

## Available Test Coverage

The test suite provides comprehensive coverage for all authentication flows:

- **Sign In Tests** (`signin.spec.ts`) - Email + Password and Email + OTP authentication
- **Sign Up Tests** (`signup.spec.ts`) - Account creation with various authentication methods  
- **Password Reset Tests** (`resetpassword.spec.ts`) - Password reset flows and edge cases
- **Multi-Factor Authentication** (`mfa.spec.ts`) - MFA setup and verification flows
- **Just-In-Time Registration** (`jit.spec.ts`) - JIT method registration during authentication
- **Sign Out Tests** (`signout.spec.ts`) - Session termination and cleanup

For detailed information about specific test scenarios, authentication flows, and implementation patterns, refer to the comprehensive context documentation linked above.
