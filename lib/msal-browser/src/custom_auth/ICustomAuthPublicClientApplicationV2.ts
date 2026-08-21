/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICustomAuthPublicClientApplication } from "./ICustomAuthPublicClientApplication.js";
import { ResetPasswordInputsV2 } from "./CustomAuthActionInputsV2.js";
import { ResetPasswordStartResultV2 } from "./core/auth_flow/v2/result/ResetPasswordStartResultV2.js";

/**
 * Public interface for the native auth V2 surface.
 */
export interface ICustomAuthPublicClientApplicationV2
    extends ICustomAuthPublicClientApplication {
    /**
     * Initiates the native auth V2 self-service password reset flow for the given username.
     * @param {ResetPasswordInputsV2} inputs - Inputs for the reset-password V2 flow
     * @returns {Promise<ResetPasswordStartResultV2>} A promise that resolves to ResetPasswordStartResultV2
     */
    resetPasswordV2(
        inputs: ResetPasswordInputsV2
    ): Promise<ResetPasswordStartResultV2>;
}
