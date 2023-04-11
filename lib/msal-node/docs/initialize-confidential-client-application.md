# Initialization of MSAL

Before you get started, please ensure you have completed all the [prerequisites](../README.md#prerequisites).

In this document:
- [Initialization of MSAL](#initialization-of-msal)
  - [Initializing the ConfidentialClientApplication object](#initializing-the-confidentialclientapplication-object)
  - [Configuration Basics](#configuration-basics)
  - [Configure Authority](#configure-authority)
  - [Advanced Configuration](#advanced-configuration)
  - [Next Steps](#next-steps)

## Initializing the ConfidentialClientApplication object

In order to use MSAL Node, you need to instantiate a [ConfidentialClient](https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_node.confidentialclientapplication.html) object.

```javascript
import * as msal from "@azure/msal-node";

const clientConfig = {
    auth: {
        clientId: "your_client_id",
        authority: "your_authority",
        clientSecret: "your_secret", // OR
        clientCertificate: {
            thumbprint: "cert_thumbprint",
            privateKey: "cert_privateKey"
        }, // OR
        clientAssertion: "assertion"
    }
};
const pca = new msal.ConfidentialClientApplication(clientConfig);
```

## Configuration Basics

[Configuration](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#configuration) options for node have `common` parameters and `specific` paremeters per authentication flow.

- `clientId` is mandatory to initialize a public client application
- `authority` defaults to `https://login.microsoftonline.com/common/` if the user does not set it during configuration
- A Client credential is mandatory for confidential clients. Client credential can be a:
    - `clientSecret` is secret string generated set on the app registration.
    - `clientCertificate` is a certificate set on the app registration. The `thumbprint` is a X.509 SHA-1 thumbprint of the certificate, and the `privateKey` is the PEM encoded private key. `x5c` is the optional X.509 certificate chain used in [subject name/issuer auth scenarios](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/sni.md).
    - `clientAssertion` is string that the application uses when requesting a token. The certificate used to sign the assertion should be set on the app registration. Assertion should be of type urn:ietf:params:oauth:client-assertion-type:jwt-bearer.


## Configure Authority

By default, MSAL is configured with the `common` tenant, which is used for multi-tenant applications and applications allowing personal accounts (not B2C).
```javascript
    authority: 'https://login.microsoftonline.com/common/'
```

If your application audience is a single tenant, you must provide an authority with your tenant id like below:
```javascript
    authority: 'https://login.microsoftonline.com/{your_tenant_id}'
```

For more information on authority, please refer to: [Authority in MSAL](../../msal-common/docs/authority.md).

## Advanced Configuration
[Configuration](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#configuration) has more options which are documented [here](./configuration.md).

## Next Steps
Proceed to understand the public APIs provided by `msal-node` for acquiring tokens [here](../../msal-common/docs/request.md)
