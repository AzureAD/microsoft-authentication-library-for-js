# MSAL Node Web App using certificates

This sample demonstrates an MSAL Node [confidential client](../../../lib/msal-node/docs/initialize-confidential-client-application.md) (web) application that lets users authenticate against **Azure AD**.

This sample requires an [Azure Key Vault](https://docs.microsoft.com/azure/key-vault/general/basic-concepts). Key Vault and related topics are discussed in [Securing MSAL Node with Azure Key Vault and Azure Managed Identity](../../../lib/msal-node/docs/key-vault-managed-identity.md).

## Setup

Locate the folder where `package.json` resides in your terminal. Then type:

```console
    npm install
```

## Register

1. Navigate to the [Azure portal](https://portal.azure.com) and select the **Azure AD** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
   - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `msal-node-webapp`.
   - Under **Supported account types**, select **Accounts in this organizational directory only**.
   - In the **Redirect URI (optional)** section, select **Web** in the combo-box and enter the following redirect URI: `http://localhost:3000/redirect`.
1. Select **Register** to create the application.
1. In the app's registration screen, find and note the **Application (client) ID** and **Directory (Tenant) ID**. You use these values in your app's configuration file(s) later.
1. Select **Save** to save your changes.
1. In the app's registration screen, select the **Certificates & secrets** blade in the left.
   - Click on **Upload** certificate and select the certificate file to upload.
   - Click **Add**. Once the certificate is uploaded, the *thumbprint*, *start date*, and *expiration* values are displayed.

Before running the sample, you will need to replace the values in the config:

```javascript
const config = {
    auth: {
        clientId: "YOUR_CLIENT_ID",
        authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
        clientCertificate: {
            thumbprint: "CERT_THUMBPRINT",
            privateKey: "CERT_PRIVATE_KEY",
        }
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};
```

## Run the app

In the same folder, type:

```console
    npm start
```

The server should start at port **3000**.

## More information

- [Microsoft identity platform application authentication certificate credentials](https://docs.microsoft.com/azure/active-directory/develop/active-directory-certificate-credentials)
