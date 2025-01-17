# Managed Identity with MSALJS

### Note

> This feature is available in msal-node 2.7.0.

A common challenge for developers is the management of secrets, credentials, certificates, and keys used to secure communication between services. [Managed identities](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview) in Azure eliminate the need for developers to handle these credentials manually. MSALJS's msal-node library supports acquiring tokens through the managed identity service when used with applications running inside Azure infrastructure, such as:

-   [Azure App Service](https://azure.microsoft.com/products/app-service/) (API version `2019-08-01` and above)
-   [Azure VMs](https://azure.microsoft.com/free/virtual-machines/)
-   [Azure Arc](https://learn.microsoft.com/en-us/azure/azure-arc/overview)
-   [Azure Cloud Shell](https://learn.microsoft.com/en-us/azure/cloud-shell/overview)
-   [Azure Service Fabric](https://learn.microsoft.com/en-us/azure/service-fabric/service-fabric-overview)
-   [Azure Machine Learning](https://azure.microsoft.com/products/machine-learning)

For a complete list, refer to [Azure services that can use managed identities to access other services](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/managed-identities-status).

> Browser-based MSALJS libraries do not offer confidential flows because there is no confidentiality between the browser and the token issuer. Additionally, they do not offer managed identity because the browser is not hosted on Azure.

## Which SDK to use - Azure SDK or MSAL?

MSAL libraries provide lower level APIs that are closer to the OAuth2 and OIDC protocols.

Both MSALJS and [Azure SDK](https://learn.microsoft.com/en-us/javascript/api/overview/azure/identity-readme?view=azure-dotnet&preserve-view=true) allow tokens to be acquired via managed identity. Internally, Azure SDK uses MSALJS, and it provides a higher-level API via its `DefaultAzureCredential` and `ManagedIdentityCredential` abstractions.

If your application already uses one of the SDKs, continue using the same SDK. Use Azure SDK, if you are writing a new application and plan to call other Azure resources, as this SDK provides a better developer experience by allowing the app to run on private developer machines where managed identity doesn't exist. Consider using MSAL if you need to call other downstream web APIs like Microsoft Graph or your own web API.

## Quick start

To quickly get started and see Azure Managed Identity in action, you can use one of [the samples](../../../samples/msal-node-samples/Managed-Identity) the team has built for this purpose.

## How to use managed identities

There are two types of managed identities available to developers - **system-assigned** and **user-assigned**. You can learn more about the differences in the [Managed identity types](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview#managed-identity-types) article. MSALJS supports acquiring tokens with both. [MSALJS logging](https://learn.microsoft.com/en-us/entra/identity-platform/msal-logging-js) allows to keep track of requests and related metadata.

Prior to using managed identities from MSALJS, developers must enable them for the resources they want to use through Azure CLI or the Azure Portal.

## Examples

For both user-assigned and system-assigned identities, developers can use the [ManagedIdentityApplication](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msi_feature_branch/lib/msal-node/src/client/ManagedIdentityApplication.ts) class.

### System-assigned managed identities

For system-assigned managed identities, the developer does not need to pass any additional information when creating an instance of ManagedIdentityApplication, as it will automatically infer the relevant metadata about the assigned identity.

[acquireToken](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msi_feature_branch/lib/msal-node/src/client/ManagedIdentityApplication.ts#L122) is called with the resource to acquire a token for, such as `https://management.azure.com`.

```typescript
// optional
const config: ManagedIdentityConfiguration = {
    system: {
        loggerOptions: {
            logLevel: LogLevel.Verbose,
        } as LoggerOptions,
    } as NodeSystemOptions,
};

const systemAssignedManagedIdentityApplication: ManagedIdentityApplication =
    new ManagedIdentityApplication(config);

const managedIdentityRequestParams: ManagedIdentityRequestParams = {
    resource: "https://management.azure.com",
};

const response: AuthenticationResult =
    await systemAssignedManagedIdentityApplication.acquireToken(
        managedIdentityRequestParams
    );
console.log(response);
```

### User-assigned managed identities

For user-assigned managed identities, the developer needs to pass either the client ID, full resource identifier, or the object ID of the managed identity when creating ManagedIdentityApplication.

Like in the case for system-assigned managed identities, ` acquireToken` is called with the resource to acquire a token for, such as `https://management.azure.com`.

```typescript
const managedIdentityIdParams: ManagedIdentityIdParams = {
    userAssignedClientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
};

const config: ManagedIdentityConfiguration = {
    managedIdentityIdParams,
    // optional
    system: {
        loggerOptions: {
            logLevel: LogLevel.Verbose,
        } as LoggerOptions,
    } as NodeSystemOptions,
};

const userAssignedClientIdManagedIdentityApplication: ManagedIdentityApplication =
    new ManagedIdentityApplication(config);

const managedIdentityRequestParams: ManagedIdentityRequestParams = {
    resource: "https://management.azure.com",
};

const response: AuthenticationResult =
    await userAssignedClientIdManagedIdentityApplication.acquireToken(
        managedIdentityRequestParams
    );
console.log(response);
```

## Caching

MSALJS caches tokens from managed identity in memory. There is no eviction, but memory is not a concern because a limited number of managed identities can be defined. Cache extensibility is not supported in this scenario because tokens should not be shared between machines.

## Troubleshooting

For failed requests the error response contains a correlation ID that can be used for further diagnostics and log analysis. Keep in mind that the correlation IDs generated in MSALJS or passed into MSAL are different than the one returned in server error responses, as MSALJS cannot pass the correlation ID to managed identity token acquisition endpoints.

### Potential errors

#### `ManagedIdentityError` Error Code: `invalid_resource` Error Message: The supplied resource is an invalid URL.

This exception might mean that the resource you are trying to acquire a token for is either not supported or is provided using the wrong resource ID format. Examples of correct resource ID formats include `https://management.azure.com/.default`, `https://management.azure.com`, and `https://graph.microsoft.com`.
