/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ICustomAuthPublicClientApplication } from "./ICustomAuthPublicClientApplication.js";
import { ResetPasswordV2Inputs } from "./CustomAuthV2ActionInputs.js";
import { ResetPasswordStartV2Result } from "./core/auth_flow/v2/result/ResetPasswordStartV2Result.js";

/**
 * Public interface for the native auth V2 surface. Extends the V1 interface
 * additively — V2 entry methods are declared here and never added to
 * {@link ICustomAuthPublicClientApplication}, so existing V1 consumers
 * (including mocks and test doubles) are unaffected.
 */
export interface ICustomAuthPublicClientApplicationV2
    extends ICustomAuthPublicClientApplication {
    /**
     * Initiates the native auth V2 self-service password reset flow for the given
     * username. On success it resolves to a continuable result whose state drives
     * the next step (typically selecting a method and verifying a one-time code).
     * @param {ResetPasswordV2Inputs} inputs - Inputs for the reset-password V2 flow
     * @returns {Promise<ResetPasswordStartV2Result>} A promise that resolves to ResetPasswordStartV2Result
     */
    resetPasswordV2(
        inputs: ResetPasswordV2Inputs
    ): Promise<ResetPasswordStartV2Result>;
}
