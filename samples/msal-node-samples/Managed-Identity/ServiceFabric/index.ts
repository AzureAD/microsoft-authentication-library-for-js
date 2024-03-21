import { LoggerOptions } from "@azure/msal-common";
import {
    AuthenticationResult,
    LogLevel,
    ManagedIdentityApplication,
    ManagedIdentityConfiguration,
    ManagedIdentityIdParams,
    ManagedIdentityRequestParams,
    NetworkRequestOptions,
    NetworkResponse,
    NodeSystemOptions,
} from "@azure/msal-node";
import { getSecretFromKeyVault } from "./HttpClient";

import express from "express";
const app: express.Application = express();

import dotenv from "dotenv";
dotenv.config();

const KEY_VAULT_URI: string = "KEY_VAULT_URI";
const SECRET_NAME: string = "SECRET_NAME";

const config: ManagedIdentityConfiguration = {
    system: {
        loggerOptions: {
            logLevel: LogLevel.Verbose,
        } as LoggerOptions,
    } as NodeSystemOptions,
};

const getSecret = async (
    managedIdentityApplication: ManagedIdentityApplication
): Promise<string> => {
    let tokenResponse: AuthenticationResult;
    try {
        const managedIdentityRequestParams: ManagedIdentityRequestParams = {
            resource: "https://vault.azure.net",
        };
        tokenResponse = await managedIdentityApplication.acquireToken(
            managedIdentityRequestParams
        );
    } catch (error) {
        throw error;
    }

    console.log(tokenResponse.accessToken);

    try {
        const secret = await getSecretFromKeyVault(
            tokenResponse.accessToken,
            KEY_VAULT_URI,
            SECRET_NAME
        );

        return `The secret, ${SECRET_NAME}, has a value of: ${secret}`;
    } catch (error) {
        throw error;
    }
};

const main = async (): Promise<string> => {
    const managedIdentityIdParams: ManagedIdentityIdParams = {
        // comment this out for a system assigned managed identity
        userAssignedClientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        // userAssignedObjectId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        // userAssignedResourceId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    };

    if (process.env.MANAGED_IDENTITY_TYPE_USER_ASSIGNED === "true") {
        if (!Object.keys(managedIdentityIdParams).length) {
            throw new Error(
                "The Managed Identity type is User Assigned, but client/object/resource id is missing."
            );
        }
        config.managedIdentityIdParams = managedIdentityIdParams;
    } else {
        if (Object.keys(managedIdentityIdParams).length) {
            throw new Error(
                "The Managed Identity type is System Assigned, but client/object/resource id has been provided."
            );
        }
    }

    const managedIdentityApplication: ManagedIdentityApplication =
        new ManagedIdentityApplication(config);

    return await getSecret(managedIdentityApplication);
};

app.get("/", async (req, res) => {
    const secretMessage: string = await main();
    return res.send(secretMessage);
});

app.listen(3000, () => {
    console.log("listening...");
});
