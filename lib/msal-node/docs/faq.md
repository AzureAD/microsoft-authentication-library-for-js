# FAQs

## General

### When is MSAL Node used?
MSAL Node supports server based authentication for public/confidential apps. This is more applicable for server based authentication scenarios/Web APIs that need authentication. A full list of supported scenarios can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node#scenarios-supported) and supported flows are listed [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node#oauth20-grant-types-supported)

### What is the status of ADAL Node? Is a migration guide available?
ADAL Node is currently in maintanence and we advise all users to move to MSAL Node as possible. MSAL Node is designed to completely replace ADAL node. We are working on a migration guide and will publish it here when available. Please note that all apps may not have a smooth migration as this is complete overhaul of the old functionality.

### What are the services supported?
MSAL Node supports AAD, MSA, ADFS and B2C. Our samples demonstrate the usage [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/standalone-samples). MSAL Node also supports [single and multi tenanted apps](https://docs.microsoft.com/azure/active-directory/develop/single-and-multi-tenant-apps).

Note: ADFS is currently supported, a standalone sample is not yet published. Please checkout this space for an update soon.

### What is a Public App or a Confidential App? What do I need to know during app registration?
Please find this in the [MSAL basics](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node#msal-basics)

### What will be the token lifetimes?
* AAD: Please find the latest reference for AAD [here](https://docs.microsoft.com/azure/active-directory/develop/active-directory-configurable-token-lifetimes). Please note that few of the configurable features for specific token types are retired recently.
* B2C: Please find the B2C token lifetime guidance [here](https://docs.microsoft.com/azure/active-directory-b2c/tokens-overview#configuration)

### How do I get the Refresh Token?
MSAL Node does not return the refresh token to the user. Instead we manage the refresh token through the cache and update it as required to fetch the corresponding IdToken and AccessToken for the developer. A detailed discussion on this can be found [here](https://docs.microsoft.com/azure/active-directory-b2c/tokens-overview#configuration)

### Is Electron supported?
Yes. We also provide a sample for [MSAL Node with Electron](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/standalone-samples/ElectronTestApp).

### Is interactive flow supported?
Currently No. Authentication for MSAL Node using authorization code grant is a two legged flow, as detailed [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/request.md). There are plans to provide a single API to achieve this, and invoke the browser on the user's behalf. However it is currently not supported.

### Are SPAs supported by MSAL Node?
Please refer to [MSAL Browser](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser) for SPA based use cases. MSAL Node should be a choice for desktop apps, web apps, web APIs or server side authentication scenarios.

### What is MSAL Node extensions? What is a Cache Plugin?
MSAL Node extensions is a support library for MSAL Node which offers secure mechanisms for client applications to perform cross-platform token cache serialization and persistence. Please find the usage, samples and more about this [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/extensions)











