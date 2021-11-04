# MSAL Node Standalone Sample: Refresh Token Grant

This sample demonstrates how to implement an MSAL Node [confidential client application](../../../lib/msal-node/docs/initialize-confidential-client-application.md) to exchange a refresh token for an access token when the said access token has expired, using the [OAuth 2.0 Refresh Token](https://oauth.net/2/grant-types/refresh-token/).

Note that MSAL does not expose refresh tokens by default and developers are not expected to build logic around them, as MSAL handles the token refreshing process itself. However, the `acquireTokenByRefreshToken()` API is useful in certain cases: for instance, if you are storing refresh tokens in a separate location (e.g. in an encrypted cache file) and you would like to use it to renew an access token or if you're migrating from ADAL Node to MSAL Node and you would like to make use of your previously acquired (and still valid) refresh tokens and etc.

## Setup

Locate the folder where `package.json` resides in your terminal. Then type:

```console
    npm install
```

## Register

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD** service.
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
   - The generated key value will be displayed when you select the **Add** button. Copy and save the generated value for use in later steps.

Before running the sample, you will need to replace the values in the configuration object:

```javascript
const config = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_INFO",
        clientSecret: "ENTER_CLIENT_SECRET"
    },
};
```

## Run the app

In the same folder, type:

```console
    npm start
```

After that, you should see the response from Azure AD in your terminal.

## More information

- [Microsoft identity platform refresh tokens](https://docs.microsoft.com/azure/active-directory/develop/refresh-tokens)