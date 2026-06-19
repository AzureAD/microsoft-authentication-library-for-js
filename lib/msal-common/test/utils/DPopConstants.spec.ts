/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationScheme,
    DPOP_NONCE_CACHE_KEY,
    DPOP_NONCE_CACHE_SCHEMA_VERSION,
    DPOP_TOKEN_TYPE,
    HeaderNames,
} from "../../src/utils/Constants";
import { ClientAuthErrorCodes } from "../../src/error/ClientAuthError";

describe("DPoP constants and type shapes", () => {
    describe("AuthenticationScheme.DPOP", () => {
        it("should equal the canonical DPoP authentication scheme", () => {
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

    describe("DPoP nonce cache constants", () => {
        it("should expose versioned cache constants", () => {
            expect(DPOP_NONCE_CACHE_KEY).toBe("dpop-nonce");
            expect(DPOP_NONCE_CACHE_SCHEMA_VERSION).toBe(1);
        });
    });

    describe("ClientAuthErrorCodes DPoP entries", () => {
        it("should expose DPoP error codes", () => {
            expect(ClientAuthErrorCodes.dpopNotEnabled).toBe(
                "dpop_not_enabled"
            );
            expect(ClientAuthErrorCodes.dpopMissingResourceContext).toBe(
                "dpop_missing_resource_context"
            );
            expect(ClientAuthErrorCodes.dpopNonceRetryFailed).toBe(
                "dpop_nonce_retry_failed"
            );
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
