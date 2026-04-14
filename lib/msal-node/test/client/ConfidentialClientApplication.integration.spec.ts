/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 *
 * Integration test for mTLS Proof-of-Possession via ConfidentialClientApplication.
 *
 * Mirrors the structure of msal-dotnet's ClientCredentialsMtlsPopTests:
 *   https://github.com/AzureAD/microsoft-authentication-library-for-dotnet/blob/main/tests/Microsoft.Identity.Test.Integration.netcore/HeadlessTests/ClientCredentialsMtlsPopTests.cs#L36
 *
 * Requirements (all must be set as environment variables to run):
 *   MTLS_POP_TENANT_ID      — Azure AD tenant ID (GUID)
 *   MTLS_POP_CLIENT_ID      — Entra app registration client ID
 *   MTLS_POP_CERT_PRIVATE_KEY — PEM private key of the SNI certificate
 *   MTLS_POP_CERT_X5C       — PEM public certificate (x5c) of the SNI certificate
 *   MTLS_POP_AZURE_REGION   — Azure region (e.g. "eastus") — optional; falls back to non-regional endpoint
 *   MTLS_POP_SCOPE          — Scope to request (e.g. "https://graph.microsoft.com/.default")
 *
 * This test is skipped automatically if any required env var is missing.
 * It is NOT run in CI by default; it is intended for manual runs on a VM or developer
 * machine that has access to the registered SNI certificate.
 */

import { ConfidentialClientApplication } from "../../src/client/ConfidentialClientApplication.js";
import { Constants } from "@azure/msal-common/node";
import { MtlsHttpClient } from "../../src/network/MtlsHttpClient.js";

const { AuthenticationScheme } = Constants;

const REQUIRED_ENV_VARS = [
    "MTLS_POP_TENANT_ID",
    "MTLS_POP_CLIENT_ID",
    "MTLS_POP_CERT_PRIVATE_KEY",
    "MTLS_POP_CERT_X5C",
    "MTLS_POP_SCOPE",
] as const;

const missingVars = REQUIRED_ENV_VARS.filter((v) => !process.env[v]);
const skipAll = missingVars.length > 0;

const describeOrSkip = skipAll ? describe.skip : describe;

describeOrSkip(
    "ConfidentialClientApplication – mTLS PoP integration",
    () => {
        const tenantId = process.env["MTLS_POP_TENANT_ID"]!;
        const clientId = process.env["MTLS_POP_CLIENT_ID"]!;
        const privateKey = process.env["MTLS_POP_CERT_PRIVATE_KEY"]!;
        const x5c = process.env["MTLS_POP_CERT_X5C"]!;
        const scope = process.env["MTLS_POP_SCOPE"]!;
        const azureRegion = process.env["MTLS_POP_AZURE_REGION"]; // optional

        function buildCca() {
            return new ConfidentialClientApplication({
                auth: {
                    clientId,
                    authority: `https://login.microsoftonline.com/${tenantId}`,
                    clientCertificate: {
                        thumbprintSha256: "placeholder", // MSAL validates format; real value not required for mTLS PoP
                        privateKey,
                        x5c,
                    },
                },
                system: {
                    networkClient: new MtlsHttpClient(x5c, privateKey),
                },
            });
        }

        it("acquires an mTLS PoP token with token_type=mtls_pop", async () => {
            const cca = buildCca();

            const result = await cca.acquireTokenByClientCredential({
                scopes: [scope],
                authenticationScheme: AuthenticationScheme.MTLS_POP,
                ...(azureRegion ? { azureRegion } : {}),
            });

            expect(result).not.toBeNull();
            expect(result!.tokenType).toBe("mtls_pop");
            expect(result!.accessToken).toBeTruthy();
        }, 30_000);

        it("returns bindingCertificate matching the configured x5c", async () => {
            const cca = buildCca();

            const result = await cca.acquireTokenByClientCredential({
                scopes: [scope],
                authenticationScheme: AuthenticationScheme.MTLS_POP,
                ...(azureRegion ? { azureRegion } : {}),
            });

            expect(result).not.toBeNull();
            expect(result!.bindingCertificate).toBeTruthy();
            // The binding certificate should be the same public cert we configured
            expect(result!.bindingCertificate).toBe(x5c);
        }, 30_000);

        it("returns fromCache=false on first call, fromCache=true on second call", async () => {
            const cca = buildCca();
            const request = {
                scopes: [scope],
                authenticationScheme: AuthenticationScheme.MTLS_POP,
                ...(azureRegion ? { azureRegion } : {}),
            };

            const first = await cca.acquireTokenByClientCredential(request);
            const second = await cca.acquireTokenByClientCredential(request);

            expect(first!.fromCache).toBe(false);
            expect(second!.fromCache).toBe(true);
            expect(second!.accessToken).toBe(first!.accessToken);
        }, 30_000);

        it("skips cache when skipCache=true and returns a fresh token", async () => {
            const cca = buildCca();
            const request = {
                scopes: [scope],
                authenticationScheme: AuthenticationScheme.MTLS_POP,
                skipCache: true,
                ...(azureRegion ? { azureRegion } : {}),
            };

            const first = await cca.acquireTokenByClientCredential(request);
            const second = await cca.acquireTokenByClientCredential(request);

            expect(first!.fromCache).toBe(false);
            expect(second!.fromCache).toBe(false);
        }, 60_000);
    }
);
