# MSAL Native Auth Sample

This sample demonstrates how to use the Native Authentication capabilities of the Microsoft Authentication Library (MSAL) for JavaScript in a browser environment.

## Features

- **Demo Mode**: Works immediately without building MSAL library (for testing UI/UX)
- **Real MSAL Integration**: Automatically detects and uses MSAL when available
- **Sign In**: Demonstrates the `signIn` function from `CustomAuthPublicClientApplication`
- **Get Current Account**: Shows how to retrieve the current authenticated account
- **Modern UI**: Clean, responsive interface for testing authentication flows
- **Real-time Logging**: See authentication results and errors in real-time

## Quick Start (Demo Mode)

The sample includes a **demo mode** that works immediately:

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Start the server**:

   ```bash
   npm start
   ```

3. **Open browser**:

   Navigate to <http://localhost:3000>

4. **Test the UI**:

   - Enter any username/password
   - Click "Sign In" to see demo authentication flow
   - Explore account management features

## Production Setup (Real MSAL)

To use with actual MSAL Native Authentication:

### Prerequisites

1. **Azure AD B2C or CIAM tenant** configured for Native Authentication
2. **Application registration** in your tenant with Native Authentication enabled
3. **API Proxy URL** configured for your Native Authentication setup

### Configuration

1. **Build the MSAL library**:

   ```bash
   cd ../../../lib/msal-browser
   npm run build:all
   ```

2. **Update configuration**:

   Open `app/authConfig.js` and replace placeholder values:

   ```javascript
   clientId: "YOUR_CLIENT_ID", // Your application's client ID
   authority: "https://YOUR_TENANT.ciamlogin.com/", // Your CIAM authority URL
   authApiProxyUrl: "https://YOUR_API_PROXY_URL", // Your API proxy URL
   ```

3. **Restart the server**:

   ```bash
   npm start
   ```

The application will automatically detect the MSAL library and switch to real authentication mode.

## Usage

### Sign In

1. Enter a username/email in the sign-in form
2. Optionally provide a password (for password-based flows)
3. Optionally specify custom scopes (comma-separated)
4. Click "Sign In" to initiate the authentication flow

### Monitor Results

- All authentication results, errors, and status messages appear in the "Results" section
- The "Account Information" section shows details of the currently authenticated user

### Additional Actions

- **Get Current Account**: Retrieves and displays information about the current account
- **Sign Out**: Clears the current session and account information
- **Clear Results**: Clears the results log

## Key Components

### CustomAuthPublicClientApplication

The main class from `@azure/msal-browser/custom_auth` that provides:

- `signIn(signInInputs)`: Initiates sign-in flow
- `getCurrentAccount(accountInputs)`: Retrieves current account
- `signUp(signUpInputs)`: Initiates sign-up flow (not implemented in this sample)
- `resetPassword(resetPasswordInputs)`: Initiates password reset (not implemented in this sample)

### Configuration

The `CustomAuthConfiguration` object includes:

- Standard MSAL configuration (`auth`, `cache`, `system`)
- Custom auth configuration (`customAuth.authApiProxyUrl`, `customAuth.challengeTypes`)

## Architecture

```text
app/
├── index.html          # Main HTML file
├── styles.css          # Application styles
├── app.js             # Main application logic (JavaScript)
└── authConfig.js      # MSAL configuration
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
- [Native Authentication Documentation](https://docs.microsoft.com/en-us/azure/active-directory-b2c/native-authentication)
- [Azure AD B2C Custom Policies](https://docs.microsoft.com/en-us/azure/active-directory-b2c/custom-policy-overview)
