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
 *
 * Reserved for the not-yet-implemented signInV2 flow; declared now so the V2
 * interface is stable and sign-in can be added without breaking changes.
 */
export type SignInV2Inputs = CustomAuthActionInputs & {
    username: string;
    password?: string;
    scopes?: Array<string>;
    claims?: string;
};

/**
 * Inputs for the native auth V2 sign-up flow.
 *
 * Reserved for the not-yet-implemented signUpV2 flow; declared now so the V2
 * interface is stable and sign-up can be added without breaking changes.
 */
export type SignUpV2Inputs = CustomAuthActionInputs & {
    username: string;
    password?: string;
    attributes?: UserAccountAttributes;
};
