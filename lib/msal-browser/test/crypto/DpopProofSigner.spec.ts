/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { createHash } from "crypto";
import { AuthToken, Constants, Logger } from "@azure/msal-common";
import { DpopProofSigner } from "../../src/crypto/DpopProofSigner.js";
import { DatabaseStorage } from "../../src/cache/DatabaseStorage.js";
import { base64Decode } from "../../src/encode/Base64Decode.js";
import { TEST_CONFIG } from "../utils/StringConstants.js";

const mockDatabase = {
    "TestDB.keys": {},
};

describe("DpopProofSigner Unit Tests", () => {
    jest.setTimeout(30000);

    beforeEach(() => {
        jest.spyOn(window.crypto.subtle, "digest").mockImplementation(
            (): Promise<ArrayBuffer> => {
                return Promise.resolve(
                    createHash("SHA256")
                        .update(Buffer.from("test-data"))
                        .digest()
                );
            }
        );

        jest.spyOn(DatabaseStorage.prototype, "open").mockImplementation(
            async () => {}
        );
        jest.spyOn(DatabaseStorage.prototype, "getItem").mockImplementation(
            async (kid: string) => {
                return mockDatabase["TestDB.keys"][kid];
            }
        );
        jest.spyOn(DatabaseStorage.prototype, "setItem").mockImplementation(
            async (kid: string, payload: any) => {
                mockDatabase["TestDB.keys"][kid] = payload;
                return mockDatabase["TestDB.keys"][kid];
            }
        );
        jest.spyOn(DatabaseStorage.prototype, "removeItem").mockImplementation(
            async (kid: string) => {
                delete mockDatabase["TestDB.keys"][kid];
            }
        );
        jest.spyOn(DatabaseStorage.prototype, "containsKey").mockImplementation(
            async (kid: string) => {
                return !!mockDatabase["TestDB.keys"][kid];
            }
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("uses configured logger when provided", () => {
        const logger = new Logger({});
        const loggerCloneSpy = jest.spyOn(logger, "clone");

        new DpopProofSigner({ logger });

        expect(loggerCloneSpy).toHaveBeenCalled();
    });

    it("generates DPoP token and resource proofs", async () => {
        const dpopProofSigner = new DpopProofSigner();
        const kid = await dpopProofSigner.generatePublicKeyThumbprint(
            TEST_CONFIG.CORRELATION_ID
        );

        const tokenProof = await dpopProofSigner.signTokenRequest(
            {
                tokenEndpoint:
                    "https://login.microsoftonline.com/common/oauth2/v2.0/token?client_id=test",
                nonce: "token-nonce",
                correlationId: TEST_CONFIG.CORRELATION_ID,
            },
            kid
        );
        const tokenHeader = JSON.parse(base64Decode(tokenProof.split(".")[0]));
        const tokenClaims = AuthToken.extractTokenClaims(
            tokenProof,
            base64Decode,
            TEST_CONFIG.CORRELATION_ID
        ) as Record<string, string>;

        expect(tokenHeader.typ).toBe(Constants.JsonWebTokenTypes.Dpop);
        expect(tokenHeader.alg).toBe("ES256");
        expect(tokenClaims.htm).toBe("POST");
        expect(tokenClaims.htu).toBe(
            "https://login.microsoftonline.com/common/oauth2/v2.0/token"
        );
        expect(tokenClaims.nonce).toBe("token-nonce");

        const resourceProof = await dpopProofSigner.signResourceRequest(
            {
                accessToken: "access-token",
                resourceRequestUri:
                    "https://graph.microsoft.com/v1.0/me?$select=id",
                resourceRequestMethod: "get",
                correlationId: TEST_CONFIG.CORRELATION_ID,
            },
            kid
        );
        const resourceClaims = AuthToken.extractTokenClaims(
            resourceProof,
            base64Decode,
            TEST_CONFIG.CORRELATION_ID
        ) as Record<string, string>;

        expect(resourceClaims.htm).toBe("GET");
        expect(resourceClaims.htu).toBe("https://graph.microsoft.com/v1.0/me");
        expect(resourceClaims.ath).toBeDefined();
    });
});
