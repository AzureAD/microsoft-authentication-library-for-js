/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationScheme,
    DPOP_NONCE_CACHE_KEY,
    DPOP_NONCE_CACHE_VERSION,
    DPOP_TOKEN_TYPE,
    HeaderNames,
} from "../../src/utils/Constants";
import * as ClientAuthErrorCodes from "../../src/error/ClientAuthErrorCodes";

describe("DPoP constants and type shapes", () => {
    describe("AuthenticationScheme.DPOP", () => {
        it("should equal 'DPoP'", () => {
            expect(AuthenticationScheme.DPOP).toBe("DPoP");
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

    describe("DPoP nonce cache constants", () => {
        it("should export the DPoP nonce cache key", () => {
            expect(DPOP_NONCE_CACHE_KEY).toBe("dpop-nonce");
        });

        it("should export the DPoP nonce cache version", () => {
            expect(DPOP_NONCE_CACHE_VERSION).toBe(1);
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
});
