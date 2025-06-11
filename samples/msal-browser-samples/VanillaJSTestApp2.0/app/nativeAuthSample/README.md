# MSAL Native Auth Sample

This sample demonstrates how to use the Native Authentication capabilities of the Microsoft Authentication Library (MSAL) for JavaScript in a browser environment. Native Authentication provides a customizable and secure way to implement authentication flows directly in your application.

## Features

- **Sign In**: Email/password, email OTP (One-Time Password), and redirect authentication flows
- **Sign Up**: User registration with email verification
- **Password Management**: Reset password functionality
- **Account Management**: Current account retrieval and sign out operations
- **Customizable UI/UX**: Fully customizable authentication experience
- **Challenge Type Support**: Support for multiple authentication challenge types
- **Automated Testing**: End-to-end test suite for all authentication flows

## Getting Started

### Prerequisites

1. **Node.js and npm**: Required to run the sample application
2. **Azure External ID Tenant**: Configured for Native Authentication
3. **Application Registration**: With Native Authentication enabled and proper redirect URIs

### Installation and Setup

1. **Clone the repository**:

   ```bash
   git clone https://github.com/AzureAD/microsoft-authentication-library-for-js.git
   cd microsoft-authentication-library-for-js/samples/msal-browser-samples/VanillaJSTestApp2.0
   ```

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

## Learn More

- [MSAL.js Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview)
- [Native Authentication Documentation](https://learn.microsoft.com/en-us/entra/identity-platform/concept-native-authentication)
