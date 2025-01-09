# MSAL Node Standalone Sample: Resource Owner Password Credentials (ROPC) Grant

This sample demonstrates how to implement an MSAL Node [confidential client application](../../../lib/msal-node/docs/initialize-confidential-client-application.md) to sign in a user and acquire an access token using the [OAuth 2.0 ROPC grant](https://datatracker.ietf.org/doc/html/rfc6749#section-4.3). Note that this flow requires a very high degree of trust in the application, and carries risks which are not present in other flows. You should only use this flow when other more secure flows can't be used (e.g. automated testing).

## Prerequisites

-   ROPC grant cannot be used with personal Microsoft accounts (MSA)
-   ROPC grant cannot be used if the user needs to perform multi-factor authentication
-   MSAL Node supports ROPC only when the authorization server is OpenID-compliant (e.g. ADFS 2019 is supported, but WS-Federation is not).

## Setup

Locate the folder where `package.json` resides in your terminal. Then type:

```console
    npm install
```

## Register

1. Navigate to the [Microsoft Entra admin center](https://entra.microsoft.com) and select the **Microsoft Entra ID** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
    - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-node-app`.
    - Under **Supported account types**, select **Accounts in this organizational directory only**.
1. Select **Register** to create the application.
1. In the app's registration screen, find and note the **Application (client) ID** and **Directory (Tenant) ID**. You use these values in your app's configuration file(s) later.
1. In the app's registration screen, select the **Certificates & secrets** blade in the left.
    - In the **Client secrets** section, select **New client secret**.
    - Type a key description (for instance `app secret`),
    - Select one of the available key durations (6 months, 12 months or Custom) as per your security posture.
    - The generated key value will be displayed when you select the **Add** button. Copy and add this client secret to the `.env` file as `CLIENT_SECRET`.

Before running the sample, you will need to replace the values in the configuration object:

**index.js**

```javascript
const msalConfig = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_INFO",
        clientSecret: process.env.CLIENT_SECRET,
    },
};
```

**.env file**

```
CLIENT_SECRET=<your client secret here>
```

## Run the app

In the same folder, type:

```console
    npm start
```

After that, you should see the response from Microsoft Entra ID in your terminal.

## More information

-   [Microsoft identity platform and OAuth 2.0 Resource Owner Password Credentials](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth-ropc)
