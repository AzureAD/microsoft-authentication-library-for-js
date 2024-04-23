# Managed Identity for Azure VM Sample

This sample demonstrates how to use [managed identity via the msal-node library](/lib/msal-node/docs/managed-identity.md) to acquire a token for accessing Azure Key Vault, on behalf of a managed identity configured on an Azure virtual machine (VM). The sample then calls the downstream API, which calls Azure Key Vault and retrieves a secret.

## Note

-   This sample is written in TypeScript and was developed with Node version 18.17.0.
-   Managed Identity is available in msal-node 2.7.0.

## Virtual Machine Setup

Follow [this guide](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/qs-configure-portal-windows-vm) to setup an Azure VM, as well as add a system assigned and user assigned managed identity to the Azure VM.

## Key Vault Setup

Follow the tutorial to provision the resources necessary for this sample: [Tutorial: Use a Windows VM system-assigned managed identity to access Azure Key Vault](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/tutorial-windows-vm-access-nonaad).

## Project Setup

In a terminal on the Azure VM, navigate to the directory where `package.json` resides. Then type:

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

## Run the app on the Azure VM

Before running the sample (and everytime changes are made to the sample), the TypeScript code will need to be compiled. In the same folder, type:

```console
    npx tsc
```

This will compile the TypeScript into JavaScript, and put the compiled files in the dist folder.

The sample can now be run by typing:

```console
    node dist/index.js
```

An npm script has been configured in package.json, which will run both of the above npx and node commands. To compile and start the sample in one command, type:

```console
    npm run start:app
```
