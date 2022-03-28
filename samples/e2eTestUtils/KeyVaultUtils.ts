/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

export const getKeyVaultSecretClient = (): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
        // DefaultAzureCredential expects the following three environment variables:
        // * AZURE_TENANT_ID: The tenant ID in Azure Active Directory
        // * AZURE_CLIENT_ID: The application (client) ID registered in the AAD tenant
        // * AZURE_CLIENT_SECRET: The client secret for the registered application
        const keyVaultCredentials = new DefaultAzureCredential();

        try {
            const client = await new SecretClient(process.env.KEY_VAULT_URL, keyVaultCredentials);
            resolve(client);
        } catch (error) {
            reject(error);
        }
    });
};

export const getCredentials = (client: any): Promise<Array<string>> => {
    const usernameSecret: string = "username";
    const passwordSecret: string = "password";

    return new Promise<Array<string>>(async (resolve, reject) => {
        let username: any;
        try {
            username = await client.getSecret(usernameSecret);
        } catch (error) {
            reject(error);
        }

        let password: any;
        try {
            password = await client.getSecret(passwordSecret);
        } catch (error) {
            reject(error);
        }

        resolve([username.value, password.value]);
    });
};