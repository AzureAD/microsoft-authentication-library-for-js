/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    DPOP_NONCE_MAX_SIZE_BYTES,
    validateDpopNonce,
} from "../../src/crypto/DpopNonceUtils.js";
import { ClientConfigurationErrorCodes } from "../../src/error/ClientConfigurationError.js";

describe("DpopNonceUtils", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("rejects an oversized code-unit string before UTF-8 encoding", () => {
        const encodeSpy = jest.spyOn(TextEncoder.prototype, "encode");

        expect(() =>
            validateDpopNonce(
                "a".repeat(DPOP_NONCE_MAX_SIZE_BYTES + 1),
                "correlation-id"
            )
        ).toThrow(ClientConfigurationErrorCodes.invalidDpopNonce);
        expect(encodeSpy).not.toHaveBeenCalled();
    });

    it("measures multibyte values exactly after the cheap precheck", () => {
        const nonce = "\u00e9".repeat(DPOP_NONCE_MAX_SIZE_BYTES / 2);
        expect(validateDpopNonce(nonce)).toBe(nonce);
        expect(() => validateDpopNonce(`${nonce}\u00e9`)).toThrow(
            ClientConfigurationErrorCodes.invalidDpopNonce
        );
    });
});
