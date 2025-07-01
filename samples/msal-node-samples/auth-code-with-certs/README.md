# MSAL Node Standalone Sample: Certificate Credentials

This sample demonstrates an MSAL Node [confidential client application](../../../lib/msal-node/docs/initialize-confidential-client-application.md) that lets users authenticate against **Microsoft Entra ID**.

This sample requires a certificate. A set of example certificate (public and private key) is placed in the [certs](./certs) folder. You can use them for testing but we recommend you generate your own certificate. Certificate generation and related topics are discussed in [Using Certificates with MSAL Node](../../../lib/msal-node/docs/certificate-credentials.md).

## Setup

Locate the folder where `package.json` resides in your terminal. Then type:

```console
    npm install
```

## Register

1. Navigate to the [Microsoft Entra admin center](https://entra.microsoft.com) and select the **Microsoft Entra ID** service.
1. Select the **App Registrations** blade on the left, then select **New registration**.
1. In the **Register an application page** that appears, enter your application's registration information:
    - In the **Name** section, enter a meaningful application name that will be displayed to users of the app, for example `ms-identity-nodejs-webapp`.
    - Under **Supported account types**, select **Accounts in this organizational directory only**.
    - In the **Redirect URI (optional)** section, select **Web** in the combo-box and enter the following redirect URI: `https://localhost:3000/redirect`.
1. Select **Register** to create the application.
1. In the app's registration screen, find and note the **Application (client) ID** and **Directory (Tenant) ID**. You use these values in your app's configuration file(s) later.
1. In the app's registration screen, select the **Certificates & secrets** blade in the left.
    - Click on **Upload** certificate and select the certificate file to upload.
    - Click **Add**. Once the certificate is uploaded, the _thumbprint_, _start date_, and _expiration_ values are displayed.

### Using secrets and certificates securely

Secrets should never be hardcoded. The dotenv npm package can be used to store secrets or certificates in a .env file (located in project's root directory) that should be included in .gitignore to prevent accidental uploads of the secrets.

Certificates can also be read-in from files via NodeJS's fs module. However, they should never be stored in the project's directory. Production apps should fetch certificates from [Azure KeyVault](https://azure.microsoft.com/products/key-vault), or other secure key vaults.

Please see [certificates and secrets](https://learn.microsoft.com/azure/active-directory/develop/security-best-practices-for-app-registration#certificates-and-secrets) for more information.

Before running the sample, you will need to replace the values in the configuration object:

```javascript
import "dotenv/config"; // process.env now has the values defined in a .env file

const config = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_ID",
        clientCertificate: {
            thumbprint: process.env.clientCertificate,
            privateKey: process.env.privateKey,
        },
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
