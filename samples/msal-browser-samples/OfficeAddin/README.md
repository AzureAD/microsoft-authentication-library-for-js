# MSAL Browser - Office Add-in Sample

This sample demonstrates how to integrate MSAL Browser with Office Add-ins using Nested App Authentication (NAA) to enable seamless authentication and Microsoft Graph API access within Office applications.

## About this sample

This Office Add-in sample shows how to:

-   Use MSAL Browser with Nested App Authentication in Office environments
-   Authenticate users silently within Office applications
-   Access Microsoft Graph APIs from within an Office Add-in
-   Handle authentication in embedded/nested application scenarios

## Notable files and what they demonstrate

### Core Application Files

1. `./manifest.xml` - Office Add-in manifest defining the add-in configuration, permissions, and entry points
1. `./src/taskpane/taskpane.html` - Main taskpane(add-in) UI with Office Fluent UI styling
1. `./src/taskpane/taskpane.js` - **Main application** - MSAL NAA integration, authentication flow, and Graph API calls
1. `./src/taskpane/taskpane.css` - Styling for the taskpane interface
1. `./src/commands/commands.js` - Integrates add-in inside Office "Commands Group" pallete

### Key Features Demonstrated

-   **Nested App Authentication (NAA)**: Uses `createNestablePublicClientApplication()` for embedded scenarios
-   **Token Acquisition**: Demonstrates `acquireTokenSilent()` and `acquireTokenInteractive` for seamless user experience
-   **Office.js Integration**: Proper initialization and integration with Office applications
-   **Microsoft Graph Integration**: Shows authenticated API calls to retrieve user profile information

## Setup

### Prerequisites

-   Ensure [all pre-requisites](../../../lib/msal-browser/README.md#prerequisites) have been completed to run `@azure/msal-browser`
-   Install Node.js if needed (<https://nodejs.org/en/>)

### Configuring a new application

1. You can use the existing application or create a [new app registration](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app) in the Microsoft Entra admin center
1. Configure the application for Office Add-ins:
    - Under the **Authentication** tab, add `https://localhost:3000` as a **Single-page application** redirect URI
    - Enable **Access tokens** and **ID tokens** under **Implicit grant and hybrid flows**
    - Add the `User.Read` scope under **API permissions**
1. Update the client ID in `./src/taskpane/taskpane.js`:
    ```javascript
    const msalConfig = {
        auth: {
            clientId: "YOUR_CLIENT_ID_HERE", // Replace with your client ID
            authority: "https://login.microsoftonline.com/YOUR_TENANT_ID", // Replace with your tenant ID
            supportsNestedAppAuth: true,
        },
        cache: {
            cacheLocation: "localStorage",
        },
    };
    ```

### Install and run the sample

1. Install dependencies:

    ```bash
    # Navigate to the OfficeAddin sample directory
    cd samples/msal-browser-samples/OfficeAddin

    # Install sample dependencies
    npm install
    ```

1. Start the development server:

    ```bash
    npm start
    ```

1. Sideload the add-in in Office:
    - Open the target Office application (Word, Excel, etc.)
    - Navigate to **Upload My Add-in**
    - Browse to and select the `manifest.xml` file from this sample directory
    - The add-in will load from the dev server at `https://localhost:3000`

## MSAL Usage in Office Add-ins

Office Add-ins run in embedded scenarios that require special consideration for authentication:

### Nested App Authentication (NAA)

```javascript
// Use createNestablePublicClientApplication for Office environments
msal.createNestablePublicClientApplication(msalConfig).then((result) => {
    pca = result;
    // Proceed with authentication
});
```

### Silent Token Acquisition

```javascript
// Attempt silent token acquisition first
const tokenRequest = {
    scopes: ["User.Read"],
    account: activeAccount,
};

pca.acquireTokenSilent(tokenRequest).then(async (result) => {
    // Use the access token for Graph API calls
    const response = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${result.accessToken}` },
    });
});
```

## Testing the Add-in

1. The add-in will appear in the Office application ribbon under the **Home** tab
1. Click the add-in button to open the taskpane
1. The authentication flow will attempt silent token acquisition
1. User profile information will be displayed at the bottom of the taskpane if successful
1. Any authentication errors will be logged to the taskpane as well as browser console
1. To debug, you can either attach a node debugger via VS Code or use the browser's debugger by right clicking on the taskpane and clicking on `Inspect`.

## Additional Resources

-   [Office Add-ins documentation](https://docs.microsoft.com/office/dev/add-ins/)
-   [MSAL Browser NAA documentation](../../../lib/msal-browser/docs/nested-app-auth.md)
-   [Microsoft Graph API documentation](https://docs.microsoft.com/graph/)
