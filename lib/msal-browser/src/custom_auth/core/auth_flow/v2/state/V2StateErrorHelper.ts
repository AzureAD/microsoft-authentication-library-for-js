/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Error } from "../../../network_client/custom_auth_api/v2/error/CustomAuthV2Error.js";
import { UnexpectedError } from "../../../network_client/custom_auth_api/v2/error/UnexpectedError.js";
import { InvalidInputError } from "../../../network_client/custom_auth_api/v2/error/InvalidInputError.js";
import { InvalidArgumentError } from "../../../error/InvalidArgumentError.js";

/*
 * Coerce an unknown value thrown while driving a V2 state action into a `CustomAuthV2Error` so it
 * can back a flow-specific `AuthFlowErrorV2Base`. Any `CustomAuthV2Error` (a wire
 * `CustomAuthV2ApiError`, or an already-mapped error) passes through unchanged; a client-side
 * `InvalidArgumentError` becomes an `InvalidInputError` (detected via `isInvalidInput()`);
 * anything else becomes an `UnexpectedError` so it is handled as an uncategorized failure rather
 * than silently matching a specific detector.
 */
export function toV2Error(
    error: unknown,
    correlationId: string
): CustomAuthV2Error {
    if (error instanceof CustomAuthV2Error) {
        return error;
    }

    if (error instanceof InvalidArgumentError) {
        return new InvalidInputError(error.errorDescription, correlationId);
    }

    return new UnexpectedError(
        error instanceof Error ? error.message : String(error),
        correlationId
    );
}
