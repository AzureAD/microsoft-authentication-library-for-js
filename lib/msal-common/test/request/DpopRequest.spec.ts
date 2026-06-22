/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationScheme,
    DPOP_TOKEN_TYPE,
    DPOP_NONCE_CACHE_KEY,
    DPOP_NONCE_CACHE_VERSION,
    HeaderNames,
} from "../../src/utils/Constants";
import { CommonAuthorizationUrlRequest } from "../../src/request/CommonAuthorizationUrlRequest";
import { AuthenticationResult } from "../../src/response/AuthenticationResult";
import {
    ClientConfigurationErrorCodes,
} from "../../src/error/ClientConfigurationError";
import { ResponseMode } from "../../src/utils/Constants";

describe("DPoP constants and request/result shape (UT-01)", () => {
    describe("AuthenticationScheme constants", () => {
        it("should include DPOP scheme additive to existing schemes", () => {
            expect(AuthenticationScheme.DPOP).toBe("dpop");
            expect(AuthenticationScheme.BEARER).toBe("Bearer");
            expect(AuthenticationScheme.POP).toBe("pop");
            expect(AuthenticationScheme.SSH).toBe("ssh-cert");
        });

        it("DPOP token type should be distinct from POP scheme", () => {
            expect(DPOP_TOKEN_TYPE).toBe("DPoP");
            expect(DPOP_TOKEN_TYPE).not.toBe(AuthenticationScheme.POP);
            expect(DPOP_TOKEN_TYPE).not.toBe(AuthenticationScheme.DPOP);
        });
    });

    describe("DPoP header and cache constants", () => {
        it("should include DPoP-Nonce header name", () => {
            expect(HeaderNames.DPopNonce).toBe("DPoP-Nonce");
        });

        it("should include DPoP nonce cache constants", () => {
            expect(DPOP_NONCE_CACHE_KEY).toBe("dpop-nonce");
            expect(DPOP_NONCE_CACHE_VERSION).toBe("1.0");
        });
    });

    describe("DPoP error codes", () => {
        it("should include dpopMissingResourceContext error code", () => {
            expect(ClientConfigurationErrorCodes.dpopMissingResourceContext).toBe(
                "dpop_missing_resource_context"
            );
        });

        it("should include dpopNonceRetryFailed error code", () => {
            expect(ClientConfigurationErrorCodes.dpopNonceRetryFailed).toBe(
                "dpop_nonce_retry_failed"
            );
        });
    });

    describe("CommonAuthorizationUrlRequest dpopJkt field", () => {
        it("should compile with dpopJkt field (type check)", () => {
            const baseRequest: CommonAuthorizationUrlRequest = {
                authority: "https://login.microsoftonline.com/common/",
                correlationId: "test-correlation-id",
                scopes: ["openid"],
                redirectUri: "https://localhost",
                responseMode: ResponseMode.QUERY,
                nonce: "test-nonce",
                state: "test-state",
                dpopJkt: "test-dpop-jkt-thumbprint",
            };
            expect(baseRequest.dpopJkt).toBe("test-dpop-jkt-thumbprint");
        });

        it("dpopJkt should be optional - compiles without it", () => {
            const baseRequest: CommonAuthorizationUrlRequest = {
                authority: "https://login.microsoftonline.com/common/",
                correlationId: "test-correlation-id",
                scopes: ["openid"],
                redirectUri: "https://localhost",
                responseMode: ResponseMode.QUERY,
                nonce: "test-nonce",
                state: "test-state",
            };
            expect(baseRequest.dpopJkt).toBeUndefined();
        });
    });

    describe("AuthenticationResult dpopProof field", () => {
        it("should compile with dpopProof field present (type check)", () => {
            const result: AuthenticationResult = {
                authority: "https://login.microsoftonline.com/common/",
                uniqueId: "unique-id",
                tenantId: "tenant-id",
                scopes: ["openid"],
                account: null,
                idToken: "id-token",
                idTokenClaims: {},
                accessToken: "access-token",
                fromCache: false,
                expiresOn: new Date(),
                tokenType: DPOP_TOKEN_TYPE,
                correlationId: "correlation-id",
                dpopProof: "dpop-proof-jwt",
            };
            expect(result.dpopProof).toBe("dpop-proof-jwt");
        });

        it("dpopProof should be optional for ****** (type check)", () => {
            const bearerResult: AuthenticationResult = {
                authority: "https://login.microsoftonline.com/common/",
                uniqueId: "unique-id",
                tenantId: "tenant-id",
                scopes: ["openid"],
                account: null,
                idToken: "id-token",
                idTokenClaims: {},
                accessToken: "access-token",
                fromCache: false,
                expiresOn: new Date(),
                tokenType: AuthenticationScheme.BEARER,
                correlationId: "correlation-id",
            };
            expect(bearerResult.dpopProof).toBeUndefined();
        });

        it("dpopProof should be optional for PoP results (type check)", () => {
            const popResult: AuthenticationResult = {
                authority: "https://login.microsoftonline.com/common/",
                uniqueId: "unique-id",
                tenantId: "tenant-id",
                scopes: ["openid"],
                account: null,
                idToken: "id-token",
                idTokenClaims: {},
                accessToken: "access-token",
                fromCache: false,
                expiresOn: new Date(),
                tokenType: AuthenticationScheme.POP,
                correlationId: "correlation-id",
            };
            expect(popResult.dpopProof).toBeUndefined();
        });

        it("dpopProof should be optional for SSH results (type check)", () => {
            const sshResult: AuthenticationResult = {
                authority: "https://login.microsoftonline.com/common/",
                uniqueId: "unique-id",
                tenantId: "tenant-id",
                scopes: ["openid"],
                account: null,
                idToken: "id-token",
                idTokenClaims: {},
                accessToken: "access-token",
                fromCache: false,
                expiresOn: new Date(),
                tokenType: AuthenticationScheme.SSH,
                correlationId: "correlation-id",
            };
            expect(sshResult.dpopProof).toBeUndefined();
        });
    });
});
