# MSAL Node Standalone Sample: Client Credentials Grant with Certificate

This sample demonstrates how to implement an MSAL Node [confidential client application](../../../lib/msal-node/docs/initialize-confidential-client-application.md) to acquire an access token with application permissions using the [OAuth 2.0 Client Credentials Grant](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow), via a certificate retrieved from a key vault.

The **Client Credentials** flow is most commonly used for a daemon or a command-line app that calls web APIs and does not have any user interaction.

This sample requires an [Azure Key Vault](https://docs.microsoft.com/azure/key-vault/general/basic-concepts). Key Vault and related topics are discussed in [Securing MSAL Node with Azure Key Vault and Azure Managed Identity](../../../lib/msal-node/docs/key-vault-managed-identity.md).

> :information_source: While you may run this sample locally, you are expected to deploy and run it on **Azure App Service** following the [guide here](../../../lib/msal-node/docs/key-vault-managed-identity.md#using-azure-managed-identity).

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
    - Click on **Upload** certificate and select the certificate file to upload.
    - Click **Add**. Once the certificate is uploaded, the _thumbprint_, _start date_, and _expiration_ values are displayed.
    - Upload the certificate to your key vault as well
1. In the app's registration screen, select the API permissions blade in the left to open the page where we add access to the APIs that your application needs.
    - Select the **Add a permission** button and then,
    - Ensure that the **Microsoft APIs** tab is selected.
    - In the **Commonly used Microsoft APIs** section, select **Microsoft Graph**
    - In the **Application permissions** section, select the **User.Read.All** in the list. Use the search box if necessary.
    - Select the **Add permissions** button at the bottom.
    - Finally, grant **admin consent** for this scope.

Before running the sample, you will need to replace the values in retrieve-cert-from-key-vault code as well as create a .env file:

```typescript
const credentials = new DefaultAzureCredential();
[thumbprint, privateKey, x5c] = await getCertificateInfo(
    credentials,
    "KEY_VAULT_URL", // e.g. "https://msidlabs.vault.azure.net"
    "CERT_NAME" // e.g. "LabAuth"
);
```

```
CLIENT_ID=YOUR_CLIENT_ID_HERE
TENANT_ID=YOUR_TENANT_ID_HERE
CLIENT_CERTIFICATE_THUMBPRINT_SHA_256=YOUR_CLIENT_CERTIFICATE_THUMBPRINT_SHA_256_HERE
CLIENT_CERTIFICATE_PRIVATE_KEY=YOUR_CLIENT_CERTIFICATE_PRIVATE_KEY_HERE
CLIENT_CERTIFICATE_X5C=YOUR_CLIENT_CERTIFICATE_X5C_HERE
```

## Run the app

Before running the sample (and everytime changes are made to the sample), the TypeScript will need to be compiled. In the same folder, type:

```console
    npx tsc
```

This will compile the TypeScript into JavaScript, and put the compiled files in the `/dist` folder.

The sample can now be run by typing:

```console
    node dist/app.js
```

An npm script, which will run the above npx and node command, has been configured in package.json. To compile and start the sample, type:

```console
    npm start
```

The token returned from Microsoft Entra ID should be immediately displayed in the terminal.
