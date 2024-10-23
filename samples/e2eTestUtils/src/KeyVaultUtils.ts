/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

export const getKeyVaultSecretClient = (
    keyVaultUrl?: string
): Promise<void> => {
    return new Promise<void>(async (resolve, reject) => {
        // DefaultAzureCredential expects the following four environment variables:
        // * AZURE_TENANT_ID: The tenant ID in Azure Active Directory
        // * AZURE_CLIENT_ID: The application (client) ID registered in the AAD tenant
        // * AZURE_CLIENT_CERTIFICATE_PATH: The path of the LabAuth cert that was created in 1P's e2e-tests.yml
        // * AZURE_CLIENT_SEND_CERTIFICATE_CHAIN: set to "true" - indicates that the LabAuth's x5c header should be sent to the keyvault
        const keyVaultCredentials = new DefaultAzureCredential();

        try {
            const client = await new SecretClient(
                keyVaultUrl || process.env["KEY_VAULT_URL"],
                keyVaultCredentials
            );
            return resolve(client);
        } catch (error) {
            return reject(error);
        }
    });
};

export const getKeyVaultSecret = async (
    client: any,
    secretName: string
): Promise<string> => {
    try {
        return (await client.getSecret(secretName)).value;
    } catch (error) {
        throw error;
    }
};

export const getCredentials = (client: any): Promise<Array<string>> => {
    const usernameSecret: string = "username";
    const passwordSecret: string = "password";

    return new Promise<Array<string>>(async (resolve, reject) => {
        let username: any;
        try {
            username = await client.getSecret(usernameSecret);
        } catch (error) {
            return reject(error);
        }

        let password: any;
        try {
            password = await client.getSecret(passwordSecret);
        } catch (error) {
            return reject(error);
        }

        return resolve([username.value, password.value]);
    });
};
