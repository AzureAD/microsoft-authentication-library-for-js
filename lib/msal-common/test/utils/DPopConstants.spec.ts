/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationScheme,
    DPOP_TOKEN_TYPE,
    HeaderNames,
} from "../../src/utils/Constants";
import { ClientAuthErrorCodes } from "../../src/error/ClientAuthError";
import type { AuthenticationResult } from "../../src/response/AuthenticationResult";

describe("DPoP constants and type shapes", () => {
    describe("AuthenticationScheme.DPOP", () => {
        it("should equal the canonical DPoP token type", () => {
            expect(AuthenticationScheme.DPOP).toBe(DPOP_TOKEN_TYPE);
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

    describe("ClientAuthErrorCodes DPoP entries", () => {
        it("should expose the disabled DPoP guard error code", () => {
            expect(ClientAuthErrorCodes.dpopNotEnabled).toBe(
                "dpop_not_enabled"
            );
        });

        it("should expose DPoP resource context and nonce retry error codes", () => {
            expect(ClientAuthErrorCodes.dpopMissingResourceContext).toBe(
                "dpop_missing_resource_context"
            );
            expect(ClientAuthErrorCodes.dpopNonceRetryFailed).toBe(
                "dpop_nonce_retry_failed"
            );
        });
    });

    describe("AuthenticationResult.dpopProof", () => {
        it("should be an optional result shape field", () => {
            const result: Partial<AuthenticationResult> = {
                dpopProof: "test-dpop-proof",
            };

            expect(result.dpopProof).toBe("test-dpop-proof");
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
});
