/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationScheme,
    DPOP_TOKEN_TYPE,
    HeaderNames,
} from "../../src/utils/Constants";
import * as ClientAuthErrorCodes from "../../src/error/ClientAuthErrorCodes";
import { AuthenticationResult } from "../../src/response/AuthenticationResult";
import { CommonAuthorizationUrlRequest } from "../../src/request/CommonAuthorizationUrlRequest";
import { ResponseMode } from "../../src/utils/Constants";

describe("DPoP constants and type shapes", () => {
    describe("AuthenticationScheme.DPOP", () => {
        it("should equal 'dpop'", () => {
            expect(AuthenticationScheme.DPOP).toBe("dpop");
        });

        it("should be additive and not affect existing schemes", () => {
            expect(AuthenticationScheme.BEARER).toBe("Bearer");
            expect(AuthenticationScheme.POP).toBe("pop");
            expect(AuthenticationScheme.SSH).toBe("ssh-cert");
        });
    });

    describe("DPOP_TOKEN_TYPE", () => {
        it("should equal 'DPoP'", () => {
            expect(DPOP_TOKEN_TYPE).toBe("DPoP");
        });
    });

    describe("HeaderNames.DPopNonce", () => {
        it("should equal 'DPoP-Nonce'", () => {
            expect(HeaderNames.DPopNonce).toBe("DPoP-Nonce");
        });

        it("should be additive and not affect existing header names", () => {
            expect(HeaderNames.WWWAuthenticate).toBe("WWW-Authenticate");
            expect(HeaderNames.AuthenticationInfo).toBe("Authentication-Info");
        });
    });

    describe("DPoP error codes", () => {
        it("should export dpopMissingResourceContext", () => {
            expect(ClientAuthErrorCodes.dpopMissingResourceContext).toBe(
                "dpop_missing_resource_context"
            );
        });

        it("should export dpopNonceRetryFailed", () => {
            expect(ClientAuthErrorCodes.dpopNonceRetryFailed).toBe(
                "dpop_nonce_retry_failed"
            );
        });

        it("should export dpopNotEnabled", () => {
            expect(ClientAuthErrorCodes.dpopNotEnabled).toBe(
                "dpop_not_enabled"
            );
        });
    });

    describe("AuthenticationResult dpopProof field", () => {
        it("should compile with optional dpopProof field", () => {
            // Type-check: dpopProof is optional and can be set
            const result: Partial<AuthenticationResult> = {
                dpopProof: "test-dpop-proof",
            };
            expect(result.dpopProof).toBe("test-dpop-proof");
        });

        it("should compile without dpopProof field", () => {
            const result: Partial<AuthenticationResult> = {};
            expect(result.dpopProof).toBeUndefined();
        });
    });

    describe("CommonAuthorizationUrlRequest dpopJkt field", () => {
        it("should compile with optional dpopJkt field", () => {
            // Type-check: dpopJkt is optional and can be set
            const request: Partial<CommonAuthorizationUrlRequest> & {
                redirectUri: string;
                responseMode: ResponseMode;
                nonce: string;
                state: string;
                scopes: string[];
                correlationId: string;
                authority: string;
            } = {
                authority: "https://login.microsoftonline.com/common",
                correlationId: "test-correlation-id",
                scopes: ["user.read"],
                redirectUri: "https://localhost",
                responseMode: ResponseMode.QUERY,
                nonce: "test-nonce",
                state: "test-state",
                dpopJkt: "test-dpop-jkt",
            };
            expect(request.dpopJkt).toBe("test-dpop-jkt");
        });

        it("should compile without dpopJkt field", () => {
            const request: Partial<CommonAuthorizationUrlRequest> = {};
            expect(request.dpopJkt).toBeUndefined();
        });
    });
});
