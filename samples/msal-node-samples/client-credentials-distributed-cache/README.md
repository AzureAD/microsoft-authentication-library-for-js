# MSAL Node Standalone Sample: Multitenant Daemon App using Client Credentials Grant

This sample demonstrates how to implement an MSAL Node [confidential client application](../../../lib/msal-node/docs/initialize-confidential-client-application.md) to acquire an access token with application permissions using the [OAuth 2.0 Client Credentials Grant](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow).

In addition, this sample uses a custom cache plugin to implement the [distributed token caching](../../../lib/msal-node/docs/caching.md#performance-and-security) pattern. Here, the cache is persisted via [Redis](https://redis.io/) and [node-redis](https://github.com/NodeRedis/node-redis).

## Setup

Locate the folder where `package.json` resides in your terminal. Then type:

```console
    npm install
```

## Register

1. Navigate to the [Microsoft Entra admin center](https://entra.microsoft.com) and select the **Microsoft Entra ID** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
    - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-node-daemon`.
    - Under **Supported account types**, select **Accounts in any organizational directory (Any Microsoft Entra ID directory - Multitenant)**.
    - In the **Redirect URI (optional)** section, select **Public client/native (mobile & desktop)** in the combo-box and enter the following redirect URI: `http://localhost` (this is required for provisioning the app into other tenants via admin consent).
1. Select **Register** to create the application.
1. In the app's registration screen, find and note the **Application (client) ID** and **Directory (Tenant) ID**. You use these values in your app's configuration file(s) later.
1. In the app's registration screen, select the **Certificates & secrets** blade in the left.
    - In the **Client secrets** section, select **New client secret**.
    - Type a key description (for instance `app secret`),
    - Select one of the available key durations (6 months, 12 months or Custom) as per your security posture.
    - The generated key value will be displayed when you select the **Add** button. Record this value for use in a later step (it's shown only once).
        > :warning: In production, use certificates with Azure Key Vault instead of secrets. See [certificate-credentials.md](../../../lib/msal-node/docs/certificate-credentials.md) and [key-vault.md](../../../lib/msal-node/docs/key-vault-managed-identity.md) for more information and examples.
1. In the app's registration screen, select the API permissions blade in the left to open the page where we add access to the APIs that your application needs.
    - Select the **Add a permission** button and then,
    - Ensure that the **Microsoft APIs** tab is selected.
    - In the **Commonly used Microsoft APIs** section, select **Microsoft Graph**
    - In the **Application permissions** section, select the **User.Read.All** in the list. Use the search box if necessary.
    - Select the **Add permissions** button at the bottom.
    - Finally, grant **admin consent** for this scope.

Before running the sample, you will need to replace the values in the configuration object (see [index.ts](./src/index.ts)):

```typescript
const appConfig: AppConfig = {
    instance:
        options.instance || process.env.INSTANCE || "ENTER_CLOUD_INSTANCE_HERE",
    tenantId: options.tenant || process.env.TENANT_ID || "ENTER_TENANT_ID_HERE",
    clientId: process.env.CLIENT_ID || "ENTER_CLIENT_ID_HERE",
    clientSecret: process.env.CLIENT_SECRET || "ENTER_CLIENT_SECRET_HERE",
};
```

## Run the app

> :warning: Make sure that the local Redis server has started before running the sample.

In the same folder, type:

```console
    npm run dev
```

After that, you should see the following prompt in your terminal.

```console
    Usage: --tenant <tenantId> --operation <operationName>

    Options:
          --help       Show help                                           [boolean]
          --version    Show version number                                 [boolean]
      -i, --instance   cloud instance                                       [string]
      -t, --tenant     tenant id                                 [string] [required]
      -o, --operation  operation name                            [string] [required]
```

Provide the required parameters. For example:

```console
    npm run dev -- --tenant <TENANT_ID> --operation getUsers
```

## Remarks

The daemon app in this sample is configured to be multitenant. In order to acquire tokens from tenants other than the one where the app was originally registered, you must provision the app by granting admin consent to the required scopes. In the sample, the admin consent request is handled in [ProvisionHandler.ts](./src/ProvisionHandler.ts). This is for demonstration purposes only.

For persisting tokens using a distributed cache, multitenant daemon apps should use the scheme `<clientId>.<tenantId>` as the partition key. This is shown in `getToken` method of [AuthProvider.ts](./src/AuthProvider.ts). See also [CustomCachePlugin.ts](./src/CustomCachePlugin.ts).

## More information

-   [Tenancy in Microsoft Entra ID](https://learn.microsoft.com/azure/active-directory/develop/single-and-multi-tenant-apps)
-   [Making your application multi-tenant](https://learn.microsoft.com/azure/active-directory/develop/howto-convert-app-to-be-multi-tenant)
-   [Admin consent on the Microsoft identity platform](https://learn.microsoft.com/azure/active-directory/develop/v2-admin-consent)
