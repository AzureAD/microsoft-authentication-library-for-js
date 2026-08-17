/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthActionInputs } from "./CustomAuthActionInputs.js";
import { UserAccountAttributes } from "./UserAccountAttributes.js";

/**
 * Inputs for the native auth V2 reset-password flow.
 */
export type ResetPasswordV2Inputs = CustomAuthActionInputs & {
    username: string;
};

/**
 * Inputs for the native auth V2 sign-in flow.
 */
export type SignInV2Inputs = CustomAuthActionInputs & {
    username: string;
    password?: string;
    scopes?: Array<string>;
    claims?: string;
};

/**
 * Inputs for the native auth V2 sign-up flow.
 */
export type SignUpV2Inputs = CustomAuthActionInputs & {
    username: string;
    password?: string;
    attributes?: UserAccountAttributes;
};

/**
 * Inputs for signing the user in after a V2 password reset completes.
 */
export type V2SignInContinuationInputs = {
    scopes?: Array<string>;
    claims?: string;
};
