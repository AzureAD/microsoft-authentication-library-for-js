# Initialization of MSAL

Before you get started, please ensure you have completed all the [prerequisites](../README.md#prerequisites).

In this document:
- [Initializing the PublicClientApplication object](#initializing-the-publicclientapplication-object)
- [Configuration](#configuration_basics)
- [(Optional) Configure Authority](#optional-configure-authority)
- [(Optional) Advanced Configuration](#advanced-configuration)

## Initializing the PublicClientApplication object

In order to use MSAL.js, you need to instantiate a [PublicClientApplication](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_publicclientapplication_.publicclientapplication.html) object.

```javascript
import * as msal from "@azure/msal-node";

const publicClientConfig = {
    auth: {
        clientId: "your_client_id",
        authority: "your_authority",
        // mandatory only for authorization code flow
        redirectUri: "your_redirect_uri",
    },
    cache: {
        cachePlugin
    },
};
const pca = new msal.PublicClientApplication(publicClientConfig);
```

## Configuration Basics

[Configuration](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/modules/_src_config_configuration_.html#configuration) options for node have `common` parameters and `specific` paremeters per authentication flow.

- `client_id` is mandatory to initializae a public client application
- `authority` defaults to `https://login.microsoftonline.com/common/` if the user does not set it during configuration

## Configure Authority

By default, MSAL is configured with the `common` tenant, which is used for multi-tenant applications and applications allowing personal accounts (not B2C).
```javascript
const msalConfig = {
    auth: {
        clientId: 'your_client_id',
        authority: 'https://login.microsoftonline.com/common/'
    }
};
```

If your application audience is a single tenant, you must provide an authority with your tenant id like below:
```javascript
const msalConfig = {
    auth: {
        clientId: 'your_client_id',
        authority: 'https://login.microsoftonline.com/{your_tenant_id}'
    }
};
```

## Advanced Configuration
[Configuration](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/modules/_src_config_configuration_.html#configuration) has more options which are documented [here](./configuration.md).

## Next Steps
Proceed to understand the public APIs provided by `msal-node` for acquiring tokens [here](../../msal-common/docs/request.md)
