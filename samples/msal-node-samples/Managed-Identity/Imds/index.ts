import { LoggerOptions } from "@azure/msal-common";
import {
    AuthenticationResult,
    LogLevel,
    ManagedIdentityApplication,
    ManagedIdentityConfiguration,
    ManagedIdentityIdParams,
    ManagedIdentityRequestParams,
    NodeSystemOptions,
} from "@azure/msal-node";
import { getSecretFromKeyVault } from "./DownstreamApi";

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
) => {
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

    try {
        const secret = await getSecretFromKeyVault(
            tokenResponse.accessToken,
            KEY_VAULT_URI,
            SECRET_NAME
        );

        console.log(`The secret, ${SECRET_NAME}, has a value of: ${secret}`);
    } catch (error) {
        throw error;
    }
};

const main = async () => {
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

    await getSecret(managedIdentityApplication);
};
main();
