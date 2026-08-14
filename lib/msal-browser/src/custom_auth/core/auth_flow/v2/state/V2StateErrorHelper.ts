/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthV2ApiError } from "../../../network_client/custom_auth_api/v2/error/CustomAuthV2ApiError.js";

/*
 * Coerce an unknown value thrown while driving a V2 state action into a `CustomAuthV2ApiError` so
 * it can back a flow-specific `AuthFlowErrorV2Base`. Wire failures already surface as this type and
 * pass through unchanged; anything else (e.g. a client-side validation error) is wrapped as a
 * `generalError` so the returned result still exposes the standard V2 detectors.
 */
export function toV2ApiError(
    error: unknown,
    correlationId: string
): CustomAuthV2ApiError {
    if (error instanceof CustomAuthV2ApiError) {
        return error;
    }

    return new CustomAuthV2ApiError(
        "generalError",
        error instanceof Error ? error.message : String(error),
        { correlationId }
    );
}
