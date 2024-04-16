# Managed Identity for Azure Service Fabric Cluster Sample

This sample demonstrates how to use [managed identity via the msal-node library](/lib/msal-node/docs/managed-identity.md) to acquire a token for accessing Azure Key Vault, on behalf of a managed identity configured on an Azure Service Fabric cluster. The sample then calls the downstream API, which calls Azure Key Vault and retrieves a secret.

## Note

-   This sample is written in TypeScript and was developed with Node version 18.17.0.

## Service Fabric Cluster Setup

Follow [this guide](https://learn.microsoft.com/en-us/azure/service-fabric/quickstart-guest-app) to setup an Azure Service Fabric cluster, as well as publish a node app to the cluster.

#### For the purpose of this sample, the following changes must be observed when following the above guide:

-   Instead of using the provided node sample, use this sample
-   The "Arguments" setting for the Service Fabric service must be changed from "server.js" to "dist/index.js"
-   The port in ServiceManifest.xml should be set to 3000 instead of 80
-   A NodeJS binary (node.exe) must be added to the project before being published to the Service Fabric cluster. This sample was developed with a NodeJS v18.17 binary.

After the Service Fabric cluster has been created via the above guide, managed identity must be enabled for it. To do so, navigate to "Virtual machine scale sets" in the Azure portal. Click on the virtual machine scale set associated with the service fabric cluster that was just created. In the left sidebar, navigate to "Security > Identity". From here, system-assigned managed identity can be enabled and user-assigned managed identities can be created.

## Key Vault Setup

Follow the tutorial to provision the resources necessary for this sample: [Tutorial: Use a Windows VM system-assigned managed identity to access Azure Key Vault](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/tutorial-windows-vm-access-nonaad).

### Note

The above guide was created for Azure VMs, but is applicable for Service Fabric clusters too. In the "Select Principal" field, choose the name of the Virtual machine scale set associated with the Service Fabric cluster.

## Project Setup

In a terminal inside of Visual Studio where the Service Fabric cluster project resides, navigate to the directory with the code from this sample. Then type:

```console
    npm install
```

In this sample, the default Managed Identity type is System Assigned. In order to create a User Assigned Managed Identity, a .env file must be created with the following value:

```
MANAGED_IDENTITY_TYPE_USER_ASSIGNED=true
```

If this environment variable has been created and set to `true`, The userAssignedClientId, userAssignedObjectId, or userAssignedResourceId value in the managedIdentityIdParams object in `index.ts` needs to be replaced by the client, object, or resource id of the user assigned managed identity that was created in the previous step:

```typescript
const managedIdentityIdParams: ManagedIdentityIdParams = {
    userAssignedClientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    // userAssignedObjectId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    // userAssignedResourceId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
};
```

Additionally, the `KEY_VAULT_URI` and `SECRET_NAME` values in `index.ts` need to be updated.

```typescript
const KEY_VAULT_URI: string = "KEY_VAULT_URI";
const SECRET_NAME: string = "SECRET_NAME";
```

## Run the app on the Service Fabric cluster

Before publishing the sample to the Service Fabric cluster (and everytime changes are made to the sample), the TypeScript code will need to be compiled. In the same folder, type:

```console
    npx tsc
```

This will compile the TypeScript into JavaScript, and put the compiled files in the dist folder.

In accordance to how the Service Fabric cluster was set up, the sample will be automatically run on the cluster every time the sample is published, via:

```console
    node.exe dist/index.js
```

Once the TypeScript has been compiled, publish the app to the Service Fabric cluster via the guide mentioned in "Service Fabric Cluster Setup".

See the secret returned from the key vault by navigating to the Service Fabric cluster's website, as detailed in the Azure portal section for the Service Fabric under the field "Client connection endpoint". However, the port at the end of the url must be changed to 3000.
