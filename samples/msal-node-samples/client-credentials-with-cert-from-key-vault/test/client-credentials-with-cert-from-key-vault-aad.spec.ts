import {
    RETRY_TIMES,
    validateCacheLocation,
    NodeCacheTestUtils,
    getCertificateInfo,
    ENV_VARIABLES,
    LAB_CERT_NAME,
    LAB_KEY_VAULT_URL,
} from "../../../e2eTestUtils/src";
import {
    AuthenticationResult,
    ConfidentialClientApplication,
    Configuration,
} from "@azure/msal-node";
import { ClientCertificateCredential } from "@azure/identity";
import getClientCredentialsToken from "../app";

const TEST_CACHE_LOCATION = `${__dirname}/data/aad.cache.json`;
const clientCredentialRequestScopes = ["https://graph.microsoft.com/.default"];

describe("Client Credentials AAD Prod Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(90000);

    let thumbprint: string;
    let privateKey: string;
    let x5c: string;
    let config: Configuration;
    beforeAll(async () => {
        await validateCacheLocation(TEST_CACHE_LOCATION);

        const credentials = new ClientCertificateCredential(
            process.env[ENV_VARIABLES.TENANT] as string,
            process.env[ENV_VARIABLES.CLIENT_ID] as string,
            process.env[ENV_VARIABLES.CERTIFICATE_PATH] as string,
            { sendCertificateChain: true }
        );
        [thumbprint, privateKey, x5c] = await getCertificateInfo(
            credentials,
            LAB_KEY_VAULT_URL,
            LAB_CERT_NAME
        );

        config = {
            auth: {
                clientId: process.env[ENV_VARIABLES.CLIENT_ID] as string,
                authority: `https://login.microsoftonline.com/${
                    process.env[ENV_VARIABLES.TENANT]
                }`,
                clientCertificate: {
                    thumbprintSha256: thumbprint,
                    privateKey: privateKey,
                    x5c: x5c,
                },
            },
        };
    });

    describe("Acquire Token", () => {
        let confidentialClientApplication: ConfidentialClientApplication;

        beforeAll(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        afterEach(async () => {
            await NodeCacheTestUtils.resetCache(TEST_CACHE_LOCATION);
        });

        it("Performs acquire token", async () => {
            confidentialClientApplication = new ConfidentialClientApplication(
                config
            );

            const authenticationResult: AuthenticationResult | null =
                await getClientCredentialsToken(
                    confidentialClientApplication,
                    clientCredentialRequestScopes
                );
            expect(authenticationResult?.accessToken).toBeTruthy();
        });
    });
});
