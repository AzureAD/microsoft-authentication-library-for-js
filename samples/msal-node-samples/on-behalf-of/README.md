# MSAL Node Standalone Sample: On-Behalf-Of Flow

This sample demonstrates how to implement an MSAL Node [confidential client application](../../../lib/msal-node/docs/initialize-confidential-client-application.md) calling a protected web API (aka *middle-tier*) which in turn calls Microsoft Graph using the [OAuth 2.0 on-behalf-of flow](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow).

The on-behalf-of is most commonly used for a web app calling a web API. That web API can also use the same flow to call subsequent web APIs, thereby establishing an *OBO chain*.

Since the on behalf of flow relies on a web app calling a web API, we rely on two separate app registrations, and two running processes. The `web-app` sample works in tandem with the sample in the `web-api` folder. Both apps must be registered and `index.js` files must be configured.

## Setup

Navigate to the `web-app` folder in your terminal. Then type:

```console
    npm install
```

Then perform the same step for `web-api`:

```console
    cd ../web-api
    npm install
```

## Register

### Register a web API

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
   - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-node-webapi`.
   - Under **Supported account types**, select **Accounts in this organizational directory only**.
1. Select **Register** to create the application.
1. In the app's registration screen, find and note the **Application (client) ID**. You use this value in your app's configuration file(s) later in your code.
1. Select **Save** to save your changes.
1. In the app's registration screen, select the **Certificates & secrets** blade in the left to open the page where we can generate secrets and upload certificates.
1. In the **Client secrets** section, select **New client secret**:
   - Type a key description (for instance `app secret`),
   - Select one of the available key durations (**In 1 year**, **In 2 years**, or **Never Expires**) as per your security posture.
   - The generated key value will be displayed when you select the **Add** button. Copy the generated value for use in the steps later.
   - You'll need this key later in your code's configuration files. This key value will not be displayed again, and is not retrievable by any other means, so make sure to note it from the Azure portal before navigating to any other screen or blade.
1. In the app's registration screen, select the **Expose an API** blade to the left to open the page where you can declare the parameters to expose this app as an API for which client applications can obtain [access tokens](https://docs.microsoft.com/azure/active-directory/develop/access-tokens) for.
The first thing that we need to do is to declare the unique [resource](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow) URI that the clients will be using to obtain access tokens for this API. To declare an resource URI, follow the following steps:
   - Select `Set` next to the **Application ID URI** to generate a URI that is unique for this app.
   - For this sample, accept the proposed Application ID URI (`api://{clientId}`) by selecting **Save**.
1. All APIs have to publish a minimum of one [scope](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow#request-an-authorization-code) for the client's to obtain an access token successfully. To publish a scope, follow the following steps:
   - Select **Add a scope** button open the **Add a scope** screen and Enter the values as indicated below:
        - For **Scope name**, use `access_as_user`.
        - Select **Admins and users** options for **Who can consent?**.
        - For **Admin consent display name** type `Access msal-node-webapi`.
        - For **Admin consent description** type `Allows the app to access msal-node-webapi as the signed-in user.`
        - For **User consent display name** type `Access msal-node-webapi`.
        - For **User consent description** type `Allow the application to access msal-node-webapi on your behalf.`
        - Keep **State** as **Enabled**.
        - Select the **Add scope** button on the bottom to save this scope.
1. On the left hand side menu, select the `Manifest` blade.
   - Set `accessTokenAcceptedVersion` property to **2**.
   - Click on **Save**.

Before running the sample, you will need to replace the values in the configuration object:

```javascript
const DISCOVERY_KEYS_ENDPOINT = "https://login.microsoftonline.com/ENTER_TENANT_INFO/discovery/v2.0/keys";

const config = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_INFO",
        clientSecret: "ENTER_CLIENT_SECRET",
    }
};
```

### Register a web app

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
   - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-node-webapp`.
   - Under **Supported account types**, select **Accounts in this organizational directory only**.
   - Under **Redirect URI (optional)**, select **Web** and set the redirect URI to **http://localhost:3000/redirect** 
1. Select **Register** to create the application.
1. In the app's registration screen, find and note the **Application (client) ID**. You use this value in your app's configuration file(s) later in your code.
1. Select **Save** to save your changes.
1. In the app's registration screen, select the **Certificates & secrets** blade in the left to open the page where we can generate secrets and upload certificates.
1. In the **Client secrets** section, select **New client secret**:
   - Type a key description (for instance `app secret`),
   - Select one of the available key durations (**In 1 year**, **In 2 years**, or **Never Expires**) as per your security posture.
   - The generated key value will be displayed when you select the **Add** button. Copy the generated value for use in the steps later.
   - You'll need this key later in your code's configuration files. This key value will not be displayed again, and is not retrievable by any other means, so make sure to note it from the Azure portal before navigating to any other screen or blade.
1. In the app's registration screen, select the **API permissions** blade in the left to open the page where we add access to the APIs that your application needs.
   - Select the **Add a permission** button and then,
   - Ensure that the **My APIs** tab is selected.
   - In the list of APIs, select the API `msal-node-webapi`.
   - In the **Delegated permissions** section, select the **access_as_user** in the list. Use the search box if necessary.
   - Select the **Add permissions** button at the bottom.

#### Configure Known Client Applications for the middle-tier web API (msal-node-webapi)

1. In the [Azure portal](https://portal.azure.com), navigate to your `msal-node-webapi` app registration, and select **Manifest** section.
1. In the manifest editor, change the `"knownClientApplications": []` line so that the array contains the Client ID of the client application (`msal-node-webapp`) as an element of the array. For example:

```json
    "knownClientApplications": ["ca8dca8d-f828-4f08-82f5-325e1a1c6428"],
```

1. **Save** the changes to the manifest.

Before running the sample, you will need to replace the values in the configuration object:

```javascript
const WEB_API_SCOPE = "api://ENTER_WEB_API_CLIENT_ID/.default";

const config = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_INFO",
        clientSecret: "ENTER_CLIENT_SECRET",
    },
};
```

## Run the app

To start the web API, type:

```console
    npm start
```

In a separate terminal window, start the web app:

```console
    cd ../web-app
    npm start
```

Open your browser and navigate to `http://localhost:3000`. This will trigger the web app to acquire an access token and call the web API, which in turn calls Microsoft Graph. You should then see the response from Graph API in your browser.

## More information

- [Scenario: A web API that calls web APIs](https://docs.microsoft.com/azure/active-directory/develop/scenario-web-api-call-api-overview)
- [The /.default scope](https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#the-default-scope)
- [The knownClientApplications attribute](https://docs.microsoft.com/azure/active-directory/develop/reference-app-manifest#knownclientapplications-attribute)
