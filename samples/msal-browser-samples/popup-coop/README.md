# MSAL Browser - Popup with Cross-Origin-Opener-Policy Sample

This sample demonstrates how to use MSAL Browser with popup authentication while implementing the `Cross-Origin-Opener-Policy` (COOP) header to enhance security. The COOP header helps protect against cross-origin attacks by isolating the browsing context.

## Setup

### Step 1: Clone or download this repository

From your shell or command line:

```bash
git clone https://github.com/AzureAD/microsoft-authentication-library-for-js.git
cd microsoft-authentication-library-for-js/samples/msal-browser-samples/popup-coop
```

### Step 2: Install dependencies

```bash
npm install
```

### Step 3: Register the sample application in Azure portal

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD** service.
2. Select the **App Registrations** blade on the left, then select **New registration**.
3. In the **Register an application page** that appears, enter your application's registration information:
    - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-browser-popup-coop`.
    - Under **Supported account types**, select **Accounts in this organizational directory only**.
    - In the **Redirect URI (optional)** section, select **Single-page application** in the combo-box and enter the following redirect URI: `http://localhost:30662/redirect`.
4. Select **Register** to create the application.
5. In the app's registration screen, find and note the **Application (client) ID**. You use this value in your app's configuration file(s) later in your code.

### Step 4: Configure the sample

1. Open the `app/authConfig.js` file.
2. Find the key `clientId` and replace the existing value with the application ID (clientId) of the application copied from the Azure portal.
3. Find the key `authority` and replace the existing value with your tenant ID if you want to sign in users from your specific tenant only.

## Running the sample

1. Start the web server:

    ```bash
    npm start
    ```

2. Open your browser and navigate to `http://localhost:30662`.

3. **Testing different COOP headers**: You can experiment with different Cross-Origin-Opener-Policy values by modifying the header in `server.js`:

    ```javascript
    res.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
    ```

    **To verify the COOP header is set correctly:**

    - Open Developer Tools (F12)
    - Go to the **Application** tab
    - Scroll down to the **top** section
    - Look for `Cross-Origin-Opener-Policy` to confirm the header value
