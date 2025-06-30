# MSAL Native Auth Sample

This sample demonstrates how to use the Native Authentication capabilities of the Microsoft Authentication Library (MSAL) for JavaScript in a browser environment. Native Authentication provides a customizable and secure way to implement authentication flows directly in your application.

[Previous sections remain unchanged up to Authentication Flow Configurations]

## Authentication Flow Configurations

Each authentication flow requires specific query parameters to configure the correct endpoint:

1. Email + Password Flow:
   ```
   ?usePwdConfig=true
   ```

2. Email + OTP Flow:
   ```
   ?useOtpConfig=true
   ```

3. Email + Password Redirect Flow:
   ```
   ?useOtpConfig=true&useRedirectConfig=true
   ```

## All E2E Tests

### Sign In Tests (`signin.spec.ts`)

#### 1. Password-based Authentication

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Build project**:

   Build msal-browser package

   ```bash
   npm run build:package
   ```

   Build msal-node package

   ```bash
   cd ../../../lib/msal-node && npm run build:all
   ```

4. **Configure the application**:

   Open `app/authConfig.js` and update with your settings:

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

5. **Locate folder VanillaJSTestApp2.0 folder and start the development server**:

   ```bash
   npm start -- --port 3000 --sample nativeAuthSample
   ```

6. **Open your browser**:

   Navigate to [http://localhost:3000](http://localhost:3000)

## Authentication Flows

### Sign In

The sample supports multiple sign-in methods:

1. **Email/Password Authentication**:
   - Enter email/username
   - Provide password
   - Submit for authentication

2. **Email OTP Authentication**:
   - Enter email address
   - Receive one-time code via email
   - Enter the code to complete authentication

3. **Redirect Authentication**:
   - Enter email address
   - System redirects to authentication provider
   - Complete authentication on provider page
   - Return to application with tokens

### Sign Up

The sign-up flow includes:

1. **Email/Password**:
   - Enter email address and basic profile information
   - Verify email with a verification code
   - Create a password
   - Complete account creation

2. **Email OTP Authentication**:
   - Enter email address and basic profile information
   - Verify email with a verification code
   - Complete account creation

### Password Reset

The password reset flow allows users to:

1. Request a password reset using their email
2. Receive a verification code via email
3. Verify identity with the code
4. Create a new password
5. Complete password reset

## Project Structure

nativeAuthSample/
├── app/                        # Application source code
│   ├── app.js                  # Main application logic
│   ├── authConfig.js           # MSAL configuration
│   ├── utilities.js            # Helper functions
│   ├── signin/                 # Sign-in functionality
│   │   ├── SignInService.js    # Sign-in business logic
│   │   ├── SignInUIManager.js  # Sign-in UI management
│   │   └── index.js            # Sign-in module exports
│   ├── signup/                 # Sign-up functionality
│   │   ├── SignUpService.js    # Sign-up business logic
│   │   ├── SignUpUIManager.js  # Sign-up UI management
│   │   └── index.js            # Sign-up module exports
│   └── resetPassword/          # Password reset functionality
│       ├── ResetPasswordService.js  # Reset password logic
│       ├── ResetPasswordUIManager.js # Reset UI management
│       └── index.js            # Reset password module exports
├── test/                       # Automated tests
│   ├── signin.spec.ts          # Sign-in flow tests
│   ├── signup.spec.ts          # Sign-up flow tests
│   ├── resetpassword.spec.ts   # Password reset tests
│   └── signout.spec.ts         # Sign-out tests
├── index.html                  # Main HTML page
├── styles.css                  # Application styles
├── cors.js                     # CORS configuration
└── proxy.config.js             # Proxy configuration

## Key Components

### CustomAuthPublicClientApplication

The core class that provides Native Authentication capabilities:

- `signIn(signInInputs)`: Initiates sign-in flow
- `getCurrentAccount(accountInputs)`: Retrieves current account
- `signUp(signUpInputs)`: Initiates sign-up flow
- `resetPassword(resetPasswordInputs)`: Initiates password reset

### Configuration

The `CustomAuthConfiguration` object includes:

- Standard MSAL configuration (`auth`, `cache`, `system`)
- Custom auth configuration (`customAuth.authApiProxyUrl`, `customAuth.challengeTypes`)

## E2E test

1. **Execute init.ps file to set up env variables**

   Under microsoft-authentication-library-for-js:
   ```bash
   gen_env.ps1
   ```

2. **Locate VanillaJSTestApp2.0 folder and run below command**

   ```bash
   npm run test:e2e -- --sample=nativeAuthSample --detectOpenHandles --forceExit --reporters=default --reporters=jest-junit
   ```

## Troubleshooting

### Common Issues

1. **MSAL not initialized**: Ensure your configuration is correct and the authority URL is accessible
2. **CORS errors**: Make sure your API proxy URL is configured to accept requests from your domain
3. **Invalid authority**: Verify your CIAM tenant URL is correct and includes the proper format

### Debug Information

- Check the browser console for detailed error messages
- The results section shows all MSAL operations and their outcomes
- Enable verbose logging by setting `logLevel: LogLevel.Verbose` in the configuration

## Native Authentication Flow

This sample demonstrates the basic Native Authentication flow:

1. **Initialize**: Create `CustomAuthPublicClientApplication` instance
2. **Sign In**: Call `signIn()` with username and optional password
3. **Handle Result**: Process the `SignInResult` which may indicate:
   - Successful authentication
   - Additional challenges required (OTP, password, etc.)
   - Error conditions

## Security Considerations

- This is a sample application for development and testing purposes
- In production, ensure proper validation of all inputs
- Use HTTPS for all authentication flows
- Store sensitive configuration securely (environment variables, key vault, etc.)

## Authentication Flow Configurations

Each authentication flow requires specific query parameters to configure the correct endpoint:

1. Email + Password Flow:
   ```
   ?usePwdConfig=true
   ```

2. Email + OTP Flow:
   ```
   ?useOtpConfig=true
   ```

3. Email + Password Redirect Flow:
   ```
   ?useOtpConfig=true&useRedirectConfig=true
   ```

## End-to-End Test Cases

### 1. Sign Up Tests

#### Email + Password Authentication

##### Positive Cases

* User inputs new email and user attributes, verifies code, creates password meeting requirements, completes sign up flow, then automatically sign-in.
* User inputs new email and user attributes, enters incorrect verification code, resend code, verifies code, creates password meeting requirements, completes sign up flow, then automatically sign-in.
* User inputs new email, verifies code, creates password meeting requirements, give user attributes, completes sign up flow, then automatically sign-in.
* User inputs new email and password, verifies code, give user attributes, completes sign up flow, then automatically sign-in.
* User inputs new email, password and user attributes, verifies code, completes sign up flow, then automatically sign-in.

##### Negative Cases

* User makes a request with invalid format email address, receives invalid email error.
* User inputs new email, verifies code, creates invalid password (does not meet requirements), receives sign up error.
* User inputs existing email (registered with email + Password), receives user existed error.
* User inputs new email and invalid attributes, receives validation error.
* User signs in an existing email, then try to sign up, receives error to sign out first.

##### Email + OTP Authentication

##### Positive Cases

* User enters new email and user attributes, verifies code successfully, completes sign up flow, then automatically sign-in.
* User enters new email and user attributes, uses invalid OTP, requests new code, completes sign up flow, then automatically sign-in.
* User enters new email, verifies code successfully, gives and user attributes, completes sign up flow, then automatically sign-in.

##### Negative Cases

* User makes a request with invalid format email address, receives invalid email error.
* User inputs new email and invalid attributes, receives validation error.

#### Redirect

* Server requires password authentication, which is not supported by the developer (aka redirect flow)

### 2. Sign In Tests

#### Email + Password Authentication

##### Positive Cases

* User inputs registered email, then provides correct password, signs in successfully, check cache tokens use getCurrentAccount.
* User inputs registered email, then provides correct password, signs in successfully, use getCurrentAccount with forceRefresh=true to force refresh tokens, ensure the access token is updated.
* User inputs registered email and password, signs in successfully
* Ability to provide scope to control auth strength of the token

##### Negative Cases

* User inputs non-registered email, receives account not found error
* User inputs registered email, provides incorrect password, receives error
* User signs in with account A, while data for account A already exists
* User email is registered with email OTP auth method, which is supported by the developer

#### Email + OTP Authentication

##### Positive Cases

* User inputs registered email, then receives OTP, verifies successfully
* User inputs registered email and OTP, signs in successfully
* User inputs registered email, enters incorrect OTP code, requests new OTP, enters valid code, signs in successfully

##### Negative Cases

* User inputs non-registered email, receives account not found error

#### Redirct

* User email is registered with email OTP auth method, which is not supported by the developer (aka redirect flow), sign in with pop up login.
* User email is registered with password method, which is not supported by client (aka redirect flow), sign in with pop up login.

### 3. Password Reset Tests

#### Email + Password Authentication

##### Positive Cases

* User requests reset inputs emails, receives code, sets new valid password, completes reset, auto-signs in
* User requests reset inputs emails, provides incorrect verification code, resend code, validates code, sets new valid password, completes reset, auto-signs in

##### Negative Cases

* User submits non-existing email, receives account not found error
* User submits existing email, but email does not linked to any password (registered as email + OTP)
* User submits existing email, receives code, creates invalid password (doesn’t meet password complexity requirements), receives requirements error

#### Redirect

* When SSPR requires a challenge type not supported by the client, redirect to web-fallback

#### 4. Sign Out Tests

* User sign in with either email + OTP or email + password flow, click sign out, cache cleared.
