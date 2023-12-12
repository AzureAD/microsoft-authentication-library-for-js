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
    resource: "https://management.azure.com",
};

// self executing anonymous function, needed for async/await usage
(async () => {
    // system assigned
    try {
        const tokenResponse: AuthenticationResult =
            await systemAssignedManagedIdentityApplication.acquireToken(
                managedIdentityRequestParams
            );
        console.log(tokenResponse);
    } catch (error) {
        console.log(error);
        throw error;
    }

    // user assigned client id
    try {
        const tokenResponse: AuthenticationResult =
            await userAssignedClientIdManagedIdentityApplication.acquireToken(
                managedIdentityRequestParams
            );
        console.log(tokenResponse);
    } catch (error) {
        console.log(error);
        throw error;
    }
})();
