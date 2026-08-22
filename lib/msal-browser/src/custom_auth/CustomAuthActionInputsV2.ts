/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthActionInputs } from "./CustomAuthActionInputs.js";
import { UserAccountAttributes } from "./UserAccountAttributes.js";

/**
 * Inputs for the native auth V2 reset-password flow.
 */
export type ResetPasswordInputsV2 = CustomAuthActionInputs & {
    username: string;
};

/**
 * Inputs for the native auth V2 sign-in flow. A supplied password is used only
 * while processing this call and is not retained in continuation state.
 */
export type SignInInputsV2 = CustomAuthActionInputs & {
    username: string;
    password?: string;
    scopes?: Array<string>;
    claims?: string;
};

/**
 * Inputs for the native auth V2 sign-up flow.
 */
export type SignUpInputsV2 = CustomAuthActionInputs & {
    username: string;
    password?: string;
    attributes?: UserAccountAttributes;
};

/**
 * Inputs for signing the user in after a V2 password reset completes.
 */
export type SignInContinuationInputsV2 = {
    scopes?: Array<string>;
    claims?: string;
};
