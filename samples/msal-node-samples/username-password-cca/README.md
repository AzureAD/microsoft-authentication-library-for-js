# MSAL Node Standalone Sample: Resource Owner Password Credentials (ROPC) Grant

This sample demonstrates how to implement an MSAL Node [confidential client application](../../../lib/msal-node/docs/initialize-confidential-client-application.md) to sign in a user and acquire an access token using the [OAuth 2.0 ROPC grant](https://datatracker.ietf.org/doc/html/rfc6749#section-4.3). Note that this flow requires a very high degree of trust in the application, and carries risks which are not present in other flows. You should only use this flow when other more secure flows can't be used (e.g. automated testing).

## Prerequisites

- ROPC grant cannot be used with personal Microsoft accounts
- ROPC grant cannot be used if the user needs to perform multi-factor authentication
- ROPC grant cannot be used with non-OpenID-compliant authorization servers (e.g. ADFS 2016)

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
1. In the **Client secrets** section, select **New client secret**:
   - Type a key description (for instance `app secret`),
   - Select one of the available key durations (**In 1 year**, **In 2 years**, or **Never Expires**) as per your security posture.
   - The generated key value will be displayed when you select the **Add** button. Copy the generated value for use in the steps later.
   - You'll need this key later in your code's configuration files. This key value will not be displayed again, and is not retrievable by any other means, so make sure to note it from the Azure portal before navigating to any other screen or blade.

Before running the sample, you will need to replace the values in the configuration object:

```javascript
const msalConfig = {
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

- [Microsoft identity platform and OAuth 2.0 Resource Owner Password Credentials](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth-ropc)