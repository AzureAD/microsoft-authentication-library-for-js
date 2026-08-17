/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { toV2Error } from "../../../../../../src/custom_auth/core/auth_flow/v2/state/V2StateErrorHelper.js";
import { CustomAuthV2ApiError } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/error/CustomAuthV2ApiError.js";
import { UnexpectedError } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/error/UnexpectedError.js";
import { InvalidInputError } from "../../../../../../src/custom_auth/core/network_client/custom_auth_api/v2/error/InvalidInputError.js";
import { InvalidArgumentError } from "../../../../../../src/custom_auth/core/error/InvalidArgumentError.js";

const CORRELATION_ID = "corr-id";

/*
 * Locks how the state layer coerces a thrown value into a CustomAuthV2Error:
 * wire errors pass through, client-side validation becomes an invalid-input
 * error, and everything else becomes an unexpected error.
 */
describe("toV2Error", () => {
    it("passes a wire CustomAuthV2ApiError through unchanged", () => {
        const apiError = new CustomAuthV2ApiError("invalidGrant", "bad code", {
            innerErrorCode: "invalidOneTimeCode",
        });

        const result = toV2Error(apiError, CORRELATION_ID);

        expect(result).toBe(apiError);
    });

    it("maps a client-side InvalidArgumentError to an InvalidInputError", () => {
        const argError = new InvalidArgumentError("username", CORRELATION_ID);

        const result = toV2Error(argError, CORRELATION_ID);

        expect(result).toBeInstanceOf(InvalidInputError);
        expect(result.code).toBe("invalid_input");
        expect(result.correlationId).toBe(CORRELATION_ID);
    });

    it("wraps any other thrown Error as an UnexpectedError", () => {
        const result = toV2Error(
            new TypeError("something broke"),
            CORRELATION_ID
        );

        expect(result).toBeInstanceOf(UnexpectedError);
        expect(result.code).toBe("unexpected_error");
        expect(result.message).toBe("something broke");
        expect(result.correlationId).toBe(CORRELATION_ID);
    });

    it("wraps a non-Error thrown value as an UnexpectedError", () => {
        const result = toV2Error("plain string", CORRELATION_ID);

        expect(result).toBeInstanceOf(UnexpectedError);
        expect(result.code).toBe("unexpected_error");
        expect(result.message).toBe("plain string");
    });
});
