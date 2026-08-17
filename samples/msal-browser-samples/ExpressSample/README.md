# MSAL.js for Express Sample - Authorization Code Flow in Single-Page Applications

## About this sample

This developer sample demonstrates how to use MSAL.js with an Express.js server to implement authentication and authorization in a single-page application.

## Notable files and what they demonstrate

### Core Application Files
1. `./server.js` - Express server setup with routes and static file serving
1. `./public/js/app.js` - Main application entry point
1. `./public/js/authConfig.js` - Configuration options for `PublicClientApplication` and token requests
1. `./public/js/auth.js` - **Authentication module** - MSAL instance management, login/logout flows, token handling
1. `./public/js/ui.js` - **UI module** - UI updates, dropdown management, authentication state display
1. `./public/js/account.js` - **Account module** - Account picker modal, account switching functionality
1. `./public/js/navigation.js` - **Navigation module** - SPA routing, protected route handling, page transitions
1. `./public/js/utils.js` - **Utility module** - Error handling, success messages, common utilities
1. `./public/js/graph.js` - MS Graph API calls with access token handling

## How to run the sample

### Pre-requisites

- Ensure [all pre-requisites](../../../lib/msal-browser/README.md#prerequisites) have been completed to run `@azure/msal-browser`.
- Install node.js if needed (<https://nodejs.org/en/>).

### Configure the application

- Create a `.env` file in this directory and add the following variables:
  ```
  CLIENT_ID=ENTER_CLIENT_ID_HERE
  AUTHORITY=https://login.microsoftonline.com/ENTER_TENANT_ID_HERE
  REDIRECT_URI=http://localhost:3000
  POST_LOGOUT_REDIRECT_URI=http://localhost:3000
  CACHE_LOCATION=localStorage
  ```

- Replace `ENTER_CLIENT_ID_HERE` with the Application (client) ID from the portal registration.
- Replace `ENTER_TENANT_ID_HERE` with the tenant ID from the portal registration.
- Optionally, you may replace any of the other parameters, or you can remove them and use the default values.

#### Install npm dependencies for sample

```bash
# Install dev dependencies for msal-browser from root of repo
npm install

# Change directory to sample directory
cd samples/msal-browser-samples/ExpressSample

# Install sample dependencies
npm install

# Build packages locally
npm run build:package
```

#### Running the sample development server

1. In a command prompt, run `npm start` or `npm run dev` (for auto-restart on changes).
1. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
1. Open [http://localhost:3000/profile](http://localhost:3000/profile) to see an example of a protected route. If you are not yet signed in, signin will be invoked automatically.

#### Using the sample

- In the web page, click on the "Sign In" button in the navigation to begin the auth flow.
- You can choose between popup or redirect authentication methods.
- Once authenticated, navigate to different pages to see how authentication state is preserved.
- **Use the account switcher** by clicking the user account dropdown and selecting "Switch Account" to see the account picker modal.
- The Profile page will automatically fetch and display your user information from MS Graph.
- Navigating to the `http://localhost:3000/playground` route will take you to the MSAL.js playground where you can experiment with different configurations and requests

## Running the e2e tests

The Puppeteer e2e tests live in [`./test`](./test). The EAR (Encrypted Authorize Response) suite is in [`./test/browserEAR.spec.ts`](./test/browserEAR.spec.ts).

That file also contains an `EAR + Platform Broker (WAM) Tests` suite that exercises EAR combined with the native platform broker (WAM). It is `describe.skip` by default because WAM is only available locally (not in CI). To run it locally, change `describe.skip` to `describe` and first set `SSO_EXTENSION_PATH` to the unpacked "Microsoft Single Sign On" extension directory (the folder containing its `manifest.json`):

```powershell
# PowerShell — set before running the EAR tests
$env:SSO_EXTENSION_PATH = "C:\Users\<you>\AppData\Local\Microsoft\Edge\User Data\Default\Extensions\ppnbnpeolgkicgegkbkbjmhlideopiji\<version>"
```

The path is machine-specific (Edge version subfolder and user profile vary). If the suite is enabled without this variable set, it fails fast with a clear error.

## Learn more

- [MSAL.js documentation](../../../lib/msal-browser/README.md)
- [Express.js documentation](https://expressjs.com/)
- [Microsoft Graph documentation](https://docs.microsoft.com/en-us/graph/)
