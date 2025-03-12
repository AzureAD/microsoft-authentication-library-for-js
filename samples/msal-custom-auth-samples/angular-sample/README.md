# MSAL Custom Auth Angular Sample

This sample demonstrates how to implement custom authentication flows in an Angular application using the Microsoft Authentication Library (MSAL) for JavaScript with custom authentication.

## Overview

This sample showcases a complete authentication flow with username/password sign-in and OTP (One-Time Password) challenge handling. It demonstrates how to:

1. Implement a sign-in form with username and password
2. Handle OTP challenges when required by the authentication service
3. Manage authentication state using Angular services
4. Use Angular standalone components and reactive forms

## Project Structure

```
angular-sample/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── sign-in/                 # Sign-in component with username/password form
│   │   │   │   ├── sign-in.component.ts
│   │   │   │   ├── sign-in.component.html
│   │   │   │   └── sign-in.component.scss
│   │   │   └── otp/                     # OTP component for handling verification codes
│   │   │       ├── otp.component.ts
│   │   │       ├── otp.component.html
│   │   │       └── otp.component.scss
│   │   ├── services/
│   │   │   └── auth.service.ts          # Authentication service for MSAL integration
│   │   ├── models/
│   │   │   └── auth.models.ts           # TypeScript interfaces for auth-related data
│   │   ├── app.component.ts             # Root component
│   │   ├── app.component.html
│   │   ├── app.component.scss
│   │   ├── app.config.ts                # App configuration
│   │   └── app.routes.ts                # Angular routing configuration
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── angular.json                         # Angular CLI configuration
├── package.json                         # Project dependencies
└── tsconfig.json                        # TypeScript configuration
```

## Prerequisites

- Node.js and npm
- Angular CLI
- A Microsoft Entra ID tenant with custom authentication enabled
- Client ID and authority URL for your application

## Setup

1. Clone the repository:

```bash
git clone https://github.com/AzureAD/microsoft-authentication-library-for-js.git
cd microsoft-authentication-library-for-js/samples/msal-custom-auth-samples/angular-sample
```

2. Install dependencies:

```bash
npm install
```

3. Configure the authentication settings:

Open `src/app/services/auth.service.ts` and update the MSAL configuration with your application's details:

```typescript
const msalConfig: CustomAuthConfiguration = {
  auth: {
    clientId: "your-client-id", // Replace with your client ID
    authority: "https://your-tenant.ciamlogin.com", // Replace with your CIAM authority
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "localStorage",
  },
  customAuth: {
    // Add any custom auth configuration here
  },
};
```

4. Start the development server:

```bash
npm start
```

5. Navigate to `http://localhost:4200` in your browser.

## Authentication Flow

This sample implements the following authentication flow:

1. User enters username and password in the sign-in form
2. The application sends the credentials to the authentication service
3. If the service requires additional verification, an OTP challenge is presented
4. User enters the verification code
5. Upon successful authentication, the user is redirected to the home page

## Key Components

### AuthService

The `AuthService` manages the authentication state and provides methods for:

- Initializing the MSAL instance
- Handling sign-in with username and password
- Processing OTP verification
- Managing authentication state
- Handling sign-out

### SignInComponent

The `SignInComponent` provides a user interface for:

- Collecting username and password
- Displaying validation errors
- Showing loading states during authentication
- Conditionally displaying the OTP component when required

### OtpComponent

The `OtpComponent` handles:

- Collecting the verification code
- Validating the code format
- Submitting the code to complete authentication
- Displaying error messages

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Additional Resources

- [Microsoft Authentication Library (MSAL) for JavaScript](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Angular Documentation](https://angular.dev)
- [Microsoft Entra ID Documentation](https://learn.microsoft.com/en-us/entra/identity/)
