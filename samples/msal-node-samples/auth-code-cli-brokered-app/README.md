# MSAL Node Standalone Sample: Brokered Auth

This sample demonstrates an MSAL Node [public client application](../../../lib/msal-node/docs/initialize-public-client-application.md) that lets users authenticate against **Azure AD** using the device broker.

## Setup

Locate the folder where `package.json` resides in your terminal. Then type:

```console
    npm install
```

## Register

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
   - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-node-cliapp`.
   - Under **Supported account types**, select **Accounts in this organizational directory only**.
   - In the **Redirect URI (optional)** section, select **Public client/native (mobile & desktop)** in the combo-box and enter the following redirect URI: `http://localhost`.
1. Select **Register** to create the application.
1. In the app's registration screen, find and note the **Application (client) ID** and **Directory (Tenant) ID**. You use these values in your app's configuration file(s) later.

Before running the sample, you will need to replace the values in the configuration object:

```javascript
const config = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_INFO",
    }
};
```

## Run the app

In the same folder, type:

```console
    npm start
```

The app should attempt to acquire a token interactively and make a call to Microsoft Graph afterwards.

## More information

- [Microsoft identity platform OAuth 2.0 Authorization Code Grant](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow)