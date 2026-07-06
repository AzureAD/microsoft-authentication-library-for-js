import {
    RETRY_TIMES,
    getCertificateInfo,
    ENV_VARIABLES,
    LAB_CERT_NAME,
    LAB_KEY_VAULT_URL,
} from "../../../e2eTestUtils/src";
import { DefaultAzureCredential } from "@azure/identity";
import { acquireFicMtlsPopToken } from "../app";

// Enable SNI (send certificate chain) for cert-based auth in CI
process.env["AZURE_CLIENT_SEND_CERTIFICATE_CHAIN"] = "true";

/*
 * The two-leg FIC (S2S) flow requires two app registrations:
 *   - FIC_LEG1_CLIENT_ID: the app whose SN/I certificate acquires the federated assertion (Leg 1).
 *   - FIC_LEG2_CLIENT_ID: the app that trusts Leg 1 (via a Federated Identity Credential) and
 *     exchanges the assertion for the final resource token (Leg 2).
 * When these are not provisioned in the environment the suite is skipped so CI stays green.
 */
const LEG1_CLIENT_ID = process.env["FIC_LEG1_CLIENT_ID"];
const LEG2_CLIENT_ID = process.env["FIC_LEG2_CLIENT_ID"];
const TENANT_ID = process.env[ENV_VARIABLES.TENANT];

// Exchange audience (caller-supplied) for the generic S2S FIC flow.
const exchangeScopes = ["api://AzureADTokenExchange/.default"];
// ESTS gates mTLS PoP on the final resource audience; Microsoft Graph is allow-listed.
const resourceScopes = ["https://graph.microsoft.com/.default"];
const REGION = "westus3";

const canRun = !!(LEG1_CLIENT_ID && LEG2_CLIENT_ID && TENANT_ID);
const describeOrSkip = canRun ? describe : describe.skip;

describeOrSkip("FIC two-leg mTLS Proof-of-Possession AAD Prod Tests", () => {
    jest.retryTimes(RETRY_TIMES);
    jest.setTimeout(120000);

    let thumbprint: string;
    let privateKey: string;
    let x5c: string;
    beforeAll(async () => {
        const credentials = new DefaultAzureCredential();
        [thumbprint, privateKey, x5c] = await getCertificateInfo(
            credentials,
            LAB_KEY_VAULT_URL,
            LAB_CERT_NAME
        );
    });

    it("acquires mTLS-PoP tokens on both legs and binds the final token to the Leg 1 certificate", async () => {
        const { leg1, leg2 } = await acquireFicMtlsPopToken({
            tenantId: TENANT_ID as string,
            leg1ClientId: LEG1_CLIENT_ID as string,
            leg2ClientId: LEG2_CLIENT_ID as string,
            cert: {
                thumbprintSha256: thumbprint,
                privateKey,
                x5c,
            },
            exchangeScopes,
            resourceScopes,
            region: REGION,
        });

        // Leg 1: SN/I cert -> mTLS-bound federated assertion.
        expect(leg1.accessToken).toBeTruthy();
        expect(leg1.tokenType).toBe("mtls_pop");
        expect(leg1.bindingCertificate?.thumbprintSha256).toBe(thumbprint);

        // Leg 2: assertion credential + Leg 1 binding cert on TLS -> final mTLS-PoP token.
        expect(leg2.accessToken).toBeTruthy();
        expect(leg2.tokenType).toBe("mtls_pop");
        // The final token is bound to the Leg 1 certificate thumbprint.
        expect(leg2.bindingCertificate?.thumbprintSha256).toBe(thumbprint);
    });
});
