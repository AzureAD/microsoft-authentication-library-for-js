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

The snippet below demonstrates how to initialize MSAL for SNI authentication:

```js
var msal = require('@azure/msal-node');
// Due to security reasons, secrets should not be hardcoded.
// The dotenv npm package can be used to store secrets in a .env file (located in project's root directory)
// that should be included in .gitignore.
require('dotenv').config(); // process.env now has the values defined in a .env file

// -----BEGIN PRIVATE KEY-----
// /**** PRIVATE KEY CONTENT ***/
// -----END PRIVATE KEY-----
const privateKey = process.env.privateKey;

// public key certificate chain. May contain more than 1 certificate sections
// -----BEGIN CERTIFICATE-----
// / *** CERTIFICATE CONTENT1 ***/
// -----END CERTIFICATE-----
// 
// -----BEGIN CERTIFICATE-----
// / *** CERTIFICATE CONTENT2 ***/
// -----END CERTIFICATE-----
const x5c = process.env.x5c;

const config = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_ID",
        clientCertificate: {
                thumbprint: process.env.thumbprint; // a 40-digit hexadecimal string
                privateKey: privateKey,
                x5c: x5c 
            }
   }
}
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(config);
```

## common issues

Please refer to [Common issues when importing certificates](./certificate-credentials.md#common-issues).
