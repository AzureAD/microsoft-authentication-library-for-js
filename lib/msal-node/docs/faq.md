# FAQs

## General

### When is MSAL Node used?
MSAL Node supports server based authentication for public/confidential apps. This is more applicable for server based authentication scenarios/Web APIs that need authentication. A full list of supported scenarios can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node#scenarios-supported) and supported flows are listed [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node#oauth20-grant-types-supported)

### What is the status of ADAL Node? Is a migration guide available?
ADAL Node is currently in maintanence and we advise all users to move to MSAL Node as possible. MSAL Node is designed to completely replace ADAL node. For those looking to migrate from ADAL to MSAL we have provided a [Migration Document](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/migration.md) to help in the migration. Please note that all apps may not have a smooth migration as this is complete overhaul of the old functionality.

### What are the services supported?
MSAL Node supports AAD, MSA, ADFS and B2C. Our samples demonstrate the usage [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/standalone-samples). MSAL Node also supports [single and multi tenanted apps](https://docs.microsoft.com/azure/active-directory/develop/single-and-multi-tenant-apps).

Note: ADFS is currently supported, a standalone sample is not yet published. Please checkout this space for an update soon.

### What is a Public App or a Confidential App? What do I need to know during app registration?
Please find this in the [MSAL basics](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node#msal-basics)

## What does authority string default to if I provide "authority" and "azureCloudOptions"?

If the developer provides `azureCloudOptions`, MSAL.js will overwrite any value provided in the `authority`. MSAL.js will also give preference to the parameters provided in a `request` over `configuration`. Please note that if `azureCloudOptions` are set in the configuration, they will take precedence over `authority` in the `request`. If the developer needs to overwrite this, they need to set `azureCloudOptions` in the `request`.

### What will be the token lifetimes?
* AAD: Please find the latest reference for AAD [here](https://docs.microsoft.com/azure/active-directory/develop/active-directory-configurable-token-lifetimes). Please note that few of the configurable features for specific token types are retired recently.
* B2C: Please find the B2C token lifetime guidance [here](https://docs.microsoft.com/azure/active-directory-b2c/tokens-overview#configuration)

### How do I get the Refresh Token?
MSAL Node does not return the refresh token to the user. Instead we manage the refresh token through the cache and update it as required to fetch the corresponding IdToken and AccessToken for the developer. A detailed discussion on this can be found [here](https://docs.microsoft.com/azure/active-directory-b2c/tokens-overview#configuration)

### Is Electron supported?
Yes. Please refer to [MSAL Node samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples).

### Is interactive flow supported?
Currently No. Authentication for MSAL Node using authorization code grant is a two legged flow, as detailed [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/request.md). There are plans to provide a single API to achieve this, and invoke the browser on the user's behalf. However it is currently not supported.

### Are SPAs supported by MSAL Node?
Please refer to [MSAL Browser](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser) for SPA based use cases. MSAL Node should be a choice for desktop apps, web apps, web APIs or server side authentication scenarios.

### What is MSAL Node extensions? What is a Cache Plugin?
MSAL Node extensions is a support library for MSAL Node which offers secure mechanisms for client applications to perform cross-platform token cache serialization and persistence. Please find the usage, samples and more about this [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/extensions)

### Can the cache plugin provided in MSAL Node extensions be used in Electron applications?
Yes, it can. In case you run into node version related issues, refer to this [note](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/extensions/docs/msal-node-extensions.md#note-for-electron-developers) that provides the steps to troubleshoot.

### What versions of Node.js are supported? How do I bypass the installation error if I want to use an active development Node.js version?
MSAL Node officially supports even numbered stable LTS releases as documented [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node#node-version-support).

If you want to work around this, please note:
- **Yarn**: Pass the `--ignore-engines` flag to the `yarn` command.
- **npm**: Add `engine-strict=false` to your .npmrc file.

### How do I implement self-service sign-up with MSAL Node?
MSAL Node supports self-service sign-up in the auth code flow. Please see our docs [here](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationurlrequest) for supported prompt values in the request and their expected outcomes, and [here](http://aka.ms/s3u) for an overview of self-service sign-up and configuration changes that need to be made to your Azure tenant. Please note that that self-service sign-up is not available in B2C and test environments.

### Why doesn't my app function correctly when it's running behind a proxy?
Developers can provide a `proxyUrl` string in the system config options as detailed [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md#system-config-options). Developers can also implement their own NetworkManager by instantiating an [INetworkModule](https://azuread.github.io/microsoft-authentication-library-for-js/ref/interfaces/_azure_msal_common.inetworkmodule.html) and building proxy support in it.

## B2C

### How do I handle the password-reset user-flow?

The [new password reset experience](https://docs.microsoft.com/azure/active-directory-b2c/add-password-reset-policy?pivots=b2c-user-flow#self-service-password-reset-recommended) is now part of the sign-up or sign-in policy. When the user selects the **Forgot your password?** link, they are immediately sent to the Forgot Password experience.

Our recommendation is to move to the new password reset experience since it simplifies the app state and reduces error handling on the user-end. If for some reason you have to use the legacy password-reset user-flow, you'll have to handle the `AADB2C90118` error code returned from B2C service when a user selects the **Forgot your password?** link. To see how this is done, refer to the sample: [MSAL Node B2C web app sample (using auth code)](../../../samples/msal-node-samples/b2c-user-flows/README.md)

## Compatibility

## Can I use MSAL Node with Microsoft Graph JavaScript SDK?

Yes, MSAL Node can be used as a custom authentication provider for the [Microsoft Graph JavaScript SDK](https://github.com/microsoftgraph/msgraph-sdk-javascript). For an implementation, please refer to the sample: [Express Web App calling Graph API](https://github.com/Azure-Samples/ms-identity-javascript-nodejs-tutorial/tree/main/2-Authorization/1-call-graph).

## Can I provision MSAL Node apps via command-line?

Yes, we recommend the new [Powershell Graph SDK](https://github.com/microsoftgraph/msgraph-sdk-powershell) for doing so. For instance, the script below creates an Azure AD application with a custom redirect URI of type **Mobile and Desktop apps** (aka *InstalledClient*) and **User.Read** permission for Microsoft Graph in a tenant specified by the user, and then provisions a service principal in the same tenant based on this application object:

```Powershell
Import-Module Microsoft.Graph.Applications

Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

Connect-MgGraph -TenantId "ENTER_TENANT_ID_HERE" -Scopes "Application.ReadWrite.All"

# User.Read delegated permission for Microsoft Graph
$mgUserReadScope = @{
    "Id" = "e1fe6dd8-ba31-4d61-89e7-88639da4683d" # permission Id
    "Type" = "Scope"
}

# Add additional permissions to array below
$mgResourceAccess = @($mgUserReadScope)

[object[]]$requiredResourceAccess = @{
    "ResourceAppId" = "00000003-0000-0000-c000-000000000000" # MS Graph App Id
    "ResourceAccess" = $mgResourceAccess
}

# Create the application
$msalApplication = New-MgApplication -displayName myMsalDesktopApp `
    -SignInAudience AzureADMyOrg `
    -PublicClient @{RedirectUris = "msal://redirect"} `
    -RequiredResourceAccess $requiredResourceAccess

# Provision the service principal
New-MgServicePrincipal -AppId $msalApplication.AppId
```
