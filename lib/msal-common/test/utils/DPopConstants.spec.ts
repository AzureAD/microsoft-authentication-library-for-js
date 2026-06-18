/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    AuthenticationScheme,
    DPOP_TOKEN_TYPE,
    HeaderNames,
} from "../../src/utils/Constants";
import type { AuthenticationResult } from "../../src/response/AuthenticationResult";

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
