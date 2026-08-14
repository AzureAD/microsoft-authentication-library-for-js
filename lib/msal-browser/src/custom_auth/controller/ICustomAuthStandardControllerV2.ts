/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ResetPasswordV2Inputs } from "../CustomAuthV2ActionInputs.js";
import { ResetPasswordStartV2Result } from "../core/auth_flow/v2/result/ResetPasswordStartV2Result.js";

export interface ICustomAuthStandardControllerV2 {
    resetPasswordV2(
        inputs: ResetPasswordV2Inputs
    ): Promise<ResetPasswordStartV2Result>;
}
