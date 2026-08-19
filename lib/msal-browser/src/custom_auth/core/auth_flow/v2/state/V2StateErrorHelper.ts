/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2Error } from "../../../network_client/custom_auth_api/v2/error/CustomAuthV2Error.js";
import { UnexpectedError } from "../../../network_client/custom_auth_api/v2/error/UnexpectedError.js";
import { InvalidInputError } from "../../../network_client/custom_auth_api/v2/error/InvalidInputError.js";
import { InvalidArgumentError } from "../../../error/InvalidArgumentError.js";

/*
 * Converts an unknown state-action failure into a `CustomAuthV2Error`. Known V2
 * errors pass through, invalid arguments become invalid input, and other values
 * become unexpected errors.
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
