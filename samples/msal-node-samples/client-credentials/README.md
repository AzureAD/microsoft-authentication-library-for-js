# MSAL Node Standalone Sample: Client Credentials Grant

This sample demonstrates how to implement an MSAL Node [confidential client application](../../../lib/msal-node/docs/initialize-confidential-client-application.md) to acquire an access token with application permissions using the [OAuth 2.0 Client Credentials Grant](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow)

The **Client Credentials** flow is most commonly used for a daemon or a command-line app that calls web APIs and does not have any user interaction.

MSAL Node also supports specifying a **regional authority** for acquiring tokens when using the client credentials flow. For more information on this, please refer to: [Regional Authorities](../../../lib/msal-node/docs/regional-authorities.md)

## Setup

Locate the folder where `package.json` resides in your terminal. Then type:

```console
    npm install
```

## Register

1. Navigate to the [Microsoft Entra admin center](https://entra.microsoft.com) and select the **Microsoft Entra ID** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
    - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-node-console`.
    - Under **Supported account types**, select **Accounts in this organizational directory only**.
1. Select **Register** to create the application.
1. In the app's registration screen, find and note the **Application (client) ID** and **Directory (Tenant) ID**. You use these values in your app's configuration file(s) later.
1. In the app's registration screen, select the **Certificates & secrets** blade in the left.
    - In the **Client secrets** section, select **New client secret**.
    - Type a key description (for instance `app secret`),
    - Select one of the available key durations (6 months, 12 months or Custom) as per your security posture.
    - The generated key value will be displayed when you select the **Add** button. Copy and save the generated value for use in later steps.
1. In the app's registration screen, select the API permissions blade in the left to open the page where we add access to the APIs that your application needs.
    - Select the **Add a permission** button and then,
    - Ensure that the **Microsoft APIs** tab is selected.
    - In the **Commonly used Microsoft APIs** section, select **Microsoft Graph**
    - In the **Application permissions** section, select the **User.Read.All** in the list. Use the search box if necessary.
    - Select the **Add permissions** button at the bottom.
    - Finally, grant **admin consent** for this scope.

Before running the sample, you will need to replace the values in the configuration object:

```javascript
const config = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_INFO",
        clientSecret: "ENTER_CLIENT_SECRET",
    },
};
```

## Run the app

In the same folder, type:

```console
    npm start
```

After that, you should see the response from Microsoft Entra ID in your terminal.

## More information

-   [Tutorial: Call the Microsoft Graph API in a Node.js console app](https://docs.microsoft.com/azure/active-directory/develop/tutorial-v2-nodejs-console)
