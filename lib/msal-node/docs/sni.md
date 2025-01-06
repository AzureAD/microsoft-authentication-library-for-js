# Subject Name/Issuer Authentication

> :warning: Before you start here, make sure you understand [Using certificate credentials with MSAL Node](./certificate-credentials.md).

SNI (Subject Name/Issuer) authentication allows an app to authenticate using a public certificate from a predetermined trusted CA to support complex certificate rollover scenarios. It uses the [X5C header parameter](https://tools.ietf.org/html/rfc7515#section-4.1.6) to provide the certificate to the server.

First party users should follow the instructions on the [internal AAD wiki](https://aadwiki.windows-int.net/index.php?title=Subject_Name_and_Issuer_Authentication) to set up their AAD environment to support SNI.

## x5c claim

You will need to supply the string from your `pem` encoded certificate to MSAL configuration object in the `clientCertificate.x5c` field in addition to providing both `clientCertificate.thumbprint` and `clientCertificate.privateKey`:

Example `x5c` string from a `.pem` file:

```text
-----BEGIN CERTIFICATE-----
<cert1>
-----END CERTIFICATE-----

-----BEGIN CERTIFICATE-----
<cert2>
-----END CERTIFICATE-----

// ...
```

See also: [Certificates: converting pfx to pem](./certificate-credentials.md#optional-converting-pfx-to-pem)

## App configuration

### Using secrets and certificates securely

Secrets should never be hardcoded. The dotenv npm package can be used to store secrets or certificates in a .env file (located in project's root directory) that should be included in .gitignore to prevent accidental uploads of the secrets.

Certificates can also be read-in from files via NodeJS's fs module. However, they should never be stored in the project's directory. Production apps should fetch certificates from [Azure KeyVault](https://azure.microsoft.com/products/key-vault), or other secure key vaults.

Please see [certificates and secrets](https://learn.microsoft.com/azure/active-directory/develop/security-best-practices-for-app-registration#certificates-and-secrets) for more information.

See the MSAL sample: [auth-code-with-certs](../../../samples/msal-node-samples/auth-code-with-certs)

The snippet below demonstrates how to initialize MSAL for Subject Name / Issuer (SNI) authentication:

```js
var msal = require('@azure/msal-node');
require('dotenv').config(); // process.env now has the values defined in a .env file

const config = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_ID",
        clientCertificate: {
                thumbprint: process.env.thumbprint, // a 40-digit hexadecimal string
                privateKey: process.env.privateKey,
                x5c: process.env.x5c
            }
   }
}
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(config);
```

## Common Issues

Please refer to [Common issues when importing certificates](./certificate-credentials.md#common-issues).
