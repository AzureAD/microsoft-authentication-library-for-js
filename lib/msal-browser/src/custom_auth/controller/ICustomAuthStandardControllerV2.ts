/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResetPasswordV2Inputs } from "../CustomAuthV2ActionInputs.js";
import { ResetPasswordStartV2Result } from "../core/auth_flow/v2/result/ResetPasswordStartV2Result.js";

/*
 * Controller interface for native auth V2 operations. Kept separate from the
 * V1 `ICustomAuthStandardController` so the V1 surface can be deleted wholesale
 * when V1 is deprecated.
 */
export interface ICustomAuthStandardControllerV2 {
    /*
     * Resets the password for the current user using the native auth V2 flow.
     * @param inputs - Inputs for the reset-password V2 flow.
     * @returns The result of the operation.
     */
    resetPasswordV2(
        inputs: ResetPasswordV2Inputs
    ): Promise<ResetPasswordStartV2Result>;
}
