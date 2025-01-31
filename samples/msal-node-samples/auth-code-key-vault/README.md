# MSAL Node Standalone Sample: Azure Key Vault Access

This sample demonstrates an MSAL Node [confidential client application](../../../lib/msal-node/docs/initialize-confidential-client-application.md) that lets users authenticate against **Microsoft Entra ID**.

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
    - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-node-webapp`.
    - Under **Supported account types**, select **Accounts in this organizational directory only**.
    - In the **Redirect URI (optional)** section, select **Web** in the combo-box and enter the following redirect URI: `http://localhost:3000/redirect`.
1. Select **Register** to create the application.
1. In the app's registration screen, find and note the **Application (client) ID** and **Directory (Tenant) ID**. You use these values in your app's configuration file(s) later.
1. In the app's registration screen, select the **Certificates & secrets** blade in the left.
    - Click on **Upload** certificate and select the certificate file to upload.
    - Click **Add**. Once the certificate is uploaded, the _thumbprint_, _start date_, and _expiration_ values are displayed.

Before running the sample, you will need to replace the values in the config:

```javascript
const KEY_VAULT_NAME =
    process.env["KEY_VAULT_NAME"] || "ENTER_YOUR_KEY_VAULT_NAME";
const CERTIFICATE_NAME =
    process.env["CERTIFICATE_NAME"] ||
    "ENTER_THE_NAME_OF_YOUR_CERTIFICATE_ON_KEY_VAULT";

const config = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_INFO",
    },
};
```

## Run the app

In the same folder, type:

```console
    npm start
```

The server should start at port **3000**. Navigate to `https://localhost:3000` in your browser, which will trigger the token acquisition process.

## More information

-   [Microsoft identity platform application authentication certificate credentials](https://docs.microsoft.com/azure/active-directory/develop/active-directory-certificate-credentials)
