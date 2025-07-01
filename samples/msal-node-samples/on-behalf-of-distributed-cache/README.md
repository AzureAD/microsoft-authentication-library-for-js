# MSAL Node Standalone Sample: Web API using On-Behalf-Of Flow

This sample demonstrates how to implement an MSAL Node [confidential client application](../../../lib/msal-node/docs/initialize-confidential-client-application.md) calling a protected web API (aka _middle-tier_) which in turn calls Microsoft Graph using the [OAuth 2.0 on-behalf-of flow](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow).

In addition, this sample uses a custom cache plugin to implement the [distributed token caching](../../../lib/msal-node/docs/caching.md#performance-and-security) pattern. Here, the cache is persisted via [Redis](https://redis.io/) and [node-redis](https://github.com/NodeRedis/node-redis).

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
        > :warning: In production, use certificates with Azure Key Vault instead of secrets. See [certificate-credentials.md](../../../lib/msal-node/docs/certificate-credentials.md) and [key-vault.md](../../../lib/msal-node/docs/key-vault-managed-identity.md) for more information and examples.
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
    - Modify the `"knownClientApplications": []` array to contain the client ID/app ID of the client application(S) that will call this web API (for example `knownClientApplications": ["APP_ID_OF_THE_CLIENT_APP"]`)
    - Click on **Save**.

Before running the sample, you'll need to:

-   make sure the Redis service is running
-   replace the values in the configuration object (see [app.ts](./src/app.ts)):

```typescript
const appConfig: AppConfig = {
    instance: process.env.INSTANCE || "ENTER_CLOUD_INSTANCE_HERE",
    tenantId: process.env.TENANT_ID || "ENTER_TENANT_ID_HERE",
    clientId: process.env.CLIENT_ID || "ENTER_CLIENT_ID_HERE",
    clientSecret: process.env.CLIENT_SECRET || "ENTER_CLIENT_SECRET_HERE",
    permissions: process.env.PERMISSIONS || "ENTER_REQUIRED_PERMISSIONS_HERE", // e.g. "access_as_user"
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
    Server is running at http://localhost:5000
```

## Remarks

You can use the [auth-code-distributed-cache](../auth-code-distributed-cache/) sample as the client app to call this web API.

For persisting tokens using a distributed cache, web APIs using OBO flow should use the scheme `hash(oboAssertion)` as the partition key. This is shown in the `getToken` method of [AuthProvider.ts](./src/AuthProvider.ts). See also [CustomCachePlugin.ts](./src/CustomCachePlugin.ts).

## More information

-   [Scenario: A web API that calls web APIs](https://docs.microsoft.com/azure/active-directory/develop/scenario-web-api-call-api-overview)
-   [The knownClientApplications attribute](https://docs.microsoft.com/azure/active-directory/develop/reference-app-manifest#knownclientapplications-attribute)
-   [The /.default scope](https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#the-default-scope)
