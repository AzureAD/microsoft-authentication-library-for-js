# MSAL Node Standalone Sample: Brokered Auth

This sample demonstrates an MSAL Node [public client application](../../../lib/msal-node/docs/initialize-public-client-application.md) that lets users authenticate against **Microsoft Entra ID** using the device broker.

## Setup

Locate the folder where `package.json` resides in your terminal. Then type:

```console
    npm install
```

## Register

1. Navigate to the [Microsoft Entra admin center](https://entra.microsoft.com) and select the **Microsoft Entra ID** service.
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
    },
};
```

On the Authenticaion Page of your app, add the following:

-   In the **Redirect URI** section, select **Public client/native (mobile & desktop)** in the combo-box and enter the following redirect URI: `ms-appx-web://Microsoft.AAD.BrokerPlugin/<your-client-id>`, replacing `<your-client-id>` with the **Application (client) ID** from your app's registration screen.
-   In the **Advanced Settings** section, set the **Allow public client flows** to **Yes**.

## Run the app

In the same folder, type:

```console
    npm start
```

The app should attempt to acquire a token interactively and make a call to Microsoft Graph afterwards.

## More information

-   [Microsoft identity platform OAuth 2.0 Authorization Code Grant](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow)
