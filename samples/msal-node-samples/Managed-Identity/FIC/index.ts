import {
    LogLevel,
    LoggerOptions,
    AuthenticationResult,
} from "@azure/msal-common";
import {
    ConfidentialClientApplication,
    ClientCredentialRequest,
    ManagedIdentityRequestParams,
    ManagedIdentityConfiguration,
    Configuration,
    ManagedIdentityApplication,
    ManagedIdentityIdParams,
    NodeSystemOptions,
} from "@azure/msal-node";
import { getSecretFromKeyVault } from "./DownstreamApi";

const KEY_VAULT_URI: string = "YOUR_KEYVAULT_URL";
const SECRET_NAME: string = "YOUR_SECRET_NAME";
const AUDIENCE: string = "api://AzureADTokenExchange";
const APP_CLIENT_ID: string = "YOUR_APP_CLIENT_ID";
const RESOURCE_TENANT_ID: string = "YOUR_RESOURCE_TENANT_ID";
const AZURE_REGION: string = "YOUR_REGION"; // Replace with the right region for your scenario. Used for ESTS-R.
/*
 * uncomment when using user assigned MI (clientId, resourceId, or ObjectId)
 * const USER_ASSIGNED_MI_ID: string = "YOUR_USER_ASSIGNED_MI_ID";
 */

async function getAccessTokenFromManagedIdentity(): Promise<string> {
    const config: ManagedIdentityConfiguration = {
        managedIdentityIdParams: {
            // uncomment only one of the following lines for user assigned managed identity
            /*
             * userAssignedClientId: USER_ASSIGNED_MI_ID,
             * userAssignedObjectId: USER_ASSIGNED_MI_ID,
             * userAssignedResourceId: USER_ASSIGNED_MI_ID,
             */
        } as ManagedIdentityIdParams,
        system: {
            loggerOptions: {
                logLevel: LogLevel.Verbose,
            } as LoggerOptions,
        } as NodeSystemOptions,
    };
    const managedIdentityApplication: ManagedIdentityApplication =
        new ManagedIdentityApplication(config);

    const managedIdentityRequestParams: ManagedIdentityRequestParams = {
        resource: AUDIENCE,
    };

    try {
        const tokenResponse: AuthenticationResult =
            await managedIdentityApplication.acquireToken(
                managedIdentityRequestParams
            );

        return tokenResponse.accessToken;
    } catch (error) {
        throw `Error acquiring token from the Managed Identity: ${error}`;
    }
}

async function createConfig(): Promise<Configuration> {
    const clientAssertion: string = await getAccessTokenFromManagedIdentity();
    return {
        auth: {
            clientId: APP_CLIENT_ID,
            authority: `https://login.microsoftonline.com/${RESOURCE_TENANT_ID}`,
            clientAssertion: clientAssertion,
        },
    };
}

const main = async () => {
    const config: Configuration = await createConfig();
    const confidentialClientApplication = new ConfidentialClientApplication(
        config
    );

    const request: ClientCredentialRequest = {
        scopes: ["https://vault.azure.net/.default"],
        azureRegion: AZURE_REGION,
    };

    let tokenResponse: AuthenticationResult | null = null;
    try {
        tokenResponse =
            await confidentialClientApplication.acquireTokenByClientCredential(
                request
            );
    } catch (error) {
        `Error acquiring token from the Confidential Client application: ${error}`;
    }

    if (!tokenResponse) {
        throw "Token was not received from the Confidential Client";
    }

    let secret: string;
    try {
        secret = await getSecretFromKeyVault(
            tokenResponse.accessToken,
            KEY_VAULT_URI,
            SECRET_NAME
        );
    } catch (error) {
        throw error;
    }

    console.log(`The secret, ${SECRET_NAME}, has a value of: ${secret}`);
};

(async () => {
    try {
        await main();
    } catch (error) {
        console.error(error);
    }
})();
