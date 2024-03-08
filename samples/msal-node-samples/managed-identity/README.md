# Managed Identity for Azure VM Sample

This sample demonstrates how to use [managed identity via the msal-node library](/lib/msal-node/docs/managed-identity.md) to retrieve tokens for a managed identity application running on an Azure VM, and then use the token to retrieve a secret from a key vault.

## Note

-   The functionality for this sample is in preview (alpha)
-   This sample is written in TypeScript and was developed with Node version 18.17.0.

## Virtual Machine Setup

Follow [this guide](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/qs-configure-portal-windows-vm) to setup an Azure VM, as well as add a system assigned and user assigned managed identity to the Azure VM.

## Key Vault Setup

Follow [this guide](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/tutorial-windows-vm-access-nonaad) to create a key vault, create a secret, and grant key vault access to the virtual machine and two managed identity applications in this sample.

## Project Setup

In a terminal on the Azure VM, navigate to the directory where `package.json` resides. Then type:

```console
    npm install
```

Before running the sample, the userAssignedClientId value in the managedIdentityIdParams object in index.ts needs to be replaced by the client id of the user assigned managed identity that was created in the previous step:

```typescript
const managedIdentityIdParams: ManagedIdentityIdParams = {
    userAssignedClientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
};
```

Additionally, the `KEY_VAULT_NAME` and `SECRET_NAME` values need to be updated.

```typescript
const KEY_VAULT_NAME: string = "KEY_VAULT_NAME";
const SECRET_NAME: string = "SECRET_NAME";
```

## Run the app on the Azure VM

Before running the sample (and everytime changes are made to the sample), the TypeScript will need to be compiled. In the same folder, type:

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

A token will be returned from the system assigned managed identity application as well as the user assigned managed identity application, and they will both be immediately displayed in the terminal.
