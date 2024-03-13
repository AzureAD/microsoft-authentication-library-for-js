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
import { getSecretFromKeyVault } from "./HttpClient";

const KEY_VAULT_NAME: string = "KEY_VAULT_NAME";
const SECRET_NAME: string = "SECRET_NAME";

const config: ManagedIdentityConfiguration = {
    system: {
        loggerOptions: {
            logLevel: LogLevel.Verbose,
        } as LoggerOptions,
    } as NodeSystemOptions,
};

const systemAssignedManagedIdentityApplication: ManagedIdentityApplication =
    new ManagedIdentityApplication(config);

const managedIdentityIdParams: ManagedIdentityIdParams = {
    userAssignedClientId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
};
const userAssignedClientIdManagedIdentityApplication: ManagedIdentityApplication =
    new ManagedIdentityApplication({
        ...config,
        managedIdentityIdParams,
    });

const managedIdentityRequestParams: ManagedIdentityRequestParams = {
    resource: "https://vault.azure.net",
};

// self executing anonymous function, needed for async/await usage
(async () => {
    // system assigned
    let systemAssignedTokenResponse: AuthenticationResult;
    try {
        systemAssignedTokenResponse =
            await systemAssignedManagedIdentityApplication.acquireToken(
                managedIdentityRequestParams
            );
    } catch (error) {
        throw error;
    }

    try {
        const secret = await getSecretFromKeyVault(
            systemAssignedTokenResponse.accessToken,
            KEY_VAULT_NAME,
            SECRET_NAME
        );

        console.log(
            `(System Assigned) The secret, ${SECRET_NAME}, has a value of: ${secret}`
        );
    } catch (error) {
        throw error;
    }

    // user assigned client id
    let userAssignedTokenResponse: AuthenticationResult;
    try {
        userAssignedTokenResponse =
            await userAssignedClientIdManagedIdentityApplication.acquireToken(
                managedIdentityRequestParams
            );
    } catch (error) {
        throw error;
    }

    try {
        const secret = await getSecretFromKeyVault(
            userAssignedTokenResponse.accessToken,
            KEY_VAULT_NAME,
            SECRET_NAME
        );

        console.log(
            `(User Assigned) The secret, ${SECRET_NAME}, has a value of: ${secret}`
        );
    } catch (error) {
        throw error;
    }
})();
