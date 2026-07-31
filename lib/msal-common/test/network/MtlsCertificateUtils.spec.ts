/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { getBearerOverMtlsCertificate } from "../../src/network/MtlsCertificateUtils.js";
import { ClientCredentials } from "../../src/account/ClientCredentials.js";
import { AuthenticationScheme } from "../../src/utils/Constants.js";

const PRIVATE_KEY =
    "-----BEGIN PRIVATE KEY-----\nMIItest\n-----END PRIVATE KEY-----";
const BARE_X5C =
    "MIIBstubbase64derbodythatislongerthansixtyfourcharsforlinewrapAAAA";
const PEM_X5C =
    "-----BEGIN CERTIFICATE-----\nMIIBstub\n-----END CERTIFICATE-----\n";

function credentials(
    overrides: Partial<ClientCredentials> = {}
): ClientCredentials {
    return {
        clientSecret: "",
        clientAssertion: undefined,
        mtlsBindingCertificate: {
            privateKey: PRIVATE_KEY,
            x5c: BARE_X5C,
        },
        sendCertificateOverMtls: true,
        ...overrides,
    };
}

describe("MtlsCertificateUtils.ts Unit Tests", () => {
    describe("getBearerOverMtlsCertificate", () => {
        it("returns the certificate when the flag is set and no auth scheme is provided", () => {
            const result = getBearerOverMtlsCertificate(credentials());
            expect(result).toBeDefined();
            expect(result?.key).toEqual(PRIVATE_KEY);
            expect(result?.cert).toContain("-----BEGIN CERTIFICATE-----");
        });

        it("returns the certificate for a Bearer scheme request", () => {
            const result = getBearerOverMtlsCertificate(
                credentials(),
                AuthenticationScheme.BEARER
            );
            expect(result).toBeDefined();
            expect(result?.cert).toContain("-----BEGIN CERTIFICATE-----");
        });

        it("returns undefined when the request is mTLS Proof-of-Possession (per-request opt-in wins)", () => {
            const result = getBearerOverMtlsCertificate(
                credentials(),
                AuthenticationScheme.MTLS_POP
            );
            expect(result).toBeUndefined();
        });

        it("returns undefined when the flag is not set", () => {
            const result = getBearerOverMtlsCertificate(
                credentials({ sendCertificateOverMtls: false })
            );
            expect(result).toBeUndefined();
        });

        it("returns undefined when there is no binding certificate", () => {
            const result = getBearerOverMtlsCertificate(
                credentials({ mtlsBindingCertificate: undefined })
            );
            expect(result).toBeUndefined();
        });

        it("wraps a bare base64 DER x5c value into PEM", () => {
            const result = getBearerOverMtlsCertificate(credentials());
            expect(result?.cert).toContain("-----BEGIN CERTIFICATE-----");
            expect(result?.cert).toContain("-----END CERTIFICATE-----");
            // 64-char line wrapping of the DER body.
            expect(result?.cert).toContain(BARE_X5C.substring(0, 64));
        });

        it("returns a PEM x5c value unchanged", () => {
            const result = getBearerOverMtlsCertificate(
                credentials({
                    mtlsBindingCertificate: {
                        privateKey: PRIVATE_KEY,
                        x5c: PEM_X5C,
                    },
                })
            );
            expect(result?.cert).toEqual(PEM_X5C);
        });
    });
});
