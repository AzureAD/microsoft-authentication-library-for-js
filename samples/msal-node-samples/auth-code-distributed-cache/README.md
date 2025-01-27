# MSAL Node Standalone Sample: Web app using Authorization Code Flow

This sample demonstrates how to implement an MSAL Node [confidential client application](../../../lib/msal-node/docs/initialize-confidential-client-application.md) calling (1) Microsoft Graph directly using the [OAuth 2.0 Authorization code grant](https://learn.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow) and (2) a protected web API (aka _middle-tier_) which in turn calls Microsoft Graph using the [OAuth 2.0 on-behalf-of flow](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow) (see also the sample: [on-behalf-of-distributed-cache](../on-behalf-of-distributed-cache)).

In addition, this sample uses the MSAL Node [DistributedCachePlugin](../../../lib/msal-node/src/cache/distributed/DistributedCachePlugin.ts) to implement the [distributed token caching](../../../lib/msal-node/docs/caching.md#performance-and-security) pattern. Here, the cache is persisted via [Redis](https://redis.io/) and [node-redis](https://github.com/NodeRedis/node-redis).

See [caching doc](../../../lib/msal-node/docs/caching.md) for more information.

## Setup

Locate the folder where `package.json` resides in your terminal. Then type:

```console
    npm install
```

## Register

1. Navigate to the [Microsoft Entra admin center](https://entra.microsoft.com) and select the **Microsoft Entra ID** service.
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
        > :warning: In production, use certificates with Azure Key Vault instead of secrets. See [certificate-credentials.md](../../../lib/msal-node/docs/certificate-credentials.md) and [key-vault.md](../../../lib/msal-node/docs/key-vault-managed-identity.md) for more information and examples.
1. (Optional) In the app's registration screen, select the **API permissions** blade in the left to open the page where we add access to the APIs that your application needs.
    - Select the **Add a permission** button and then,
    - Ensure that the **My APIs** tab is selected.
    - In the list of APIs, select the API `msal-node-webapi`.
    - In the **Delegated permissions** section, select the **access_as_user** in the list. Use the search box if necessary.
    - Select the **Add permissions** button at the bottom.

Before running the sample, you will need to replace the values in the configuration object (see [app.ts](./src/app.ts)):

```typescript
const appConfig: AppConfig = {
    instance: process.env.INSTANCE || "ENTER_CLOUD_INSTANCE_HERE",
    tenantId: process.env.TENANT_ID || "ENTER_TENANT_ID_HERE",
    clientId: process.env.CLIENT_ID || "ENTER_CLIENT_ID_HERE",
    clientSecret: process.env.CLIENT_SECRET || "ENTER_CLIENT_SECRET_HERE",
    redirectUri: process.env.REDIRECT_URI || "ENTER_REDIRECT_URI_HERE",
};
```

## Run the app

> :warning: Make sure that the local Redis server has started before running the sample.

In the same folder, type:

```console
    npm run dev
```

After that, you should see the following in your terminal:

```console
    Server is running at http://localhost:3000
```

Open a browser tab and navigate to `http://localhost:3000`. Then:

1. Sign-in when prompted by Microsoft Entra ID.
1. Select **Acquire a token to call Microsoft Graph** to call Microsoft Graph directly using the auth code flow.
1. Select **Acquire a token to call a web API that calls Microsoft Graph on your behalf** to call Microsoft Graph indirectly via a web API using the on-behalf-of flow.

## Remarks

You can use the [on-behalf-of-distributed-cache](../on-behalf-of-distributed-cache) sample as the service app to call with this client app.

For persisting tokens using a distributed cache, web apps using auth code flow should use the scheme `<oid>.<tid>` as the partition key. This is shown in the `getToken` methods of [AuthProvider.ts](./src/AuthProvider.ts). See also [PartitionManager.ts](./src/PartitionManager.ts).

## More information

-   [Scenario: Web app that signs in users](https://learn.microsoft.com/azure/active-directory/develop/scenario-web-app-sign-user-overview)
-   [Scenario: A web app that authenticates users and calls web APIs](https://learn.microsoft.com/azure/active-directory/develop/scenario-web-app-call-api-overview)
