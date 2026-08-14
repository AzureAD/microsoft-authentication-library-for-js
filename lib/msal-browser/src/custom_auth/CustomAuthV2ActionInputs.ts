/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthActionInputs } from "./CustomAuthActionInputs.js";
import { UserAccountAttributes } from "./UserAccountAttributes.js";

/**
 * Inputs for the native auth V2 reset-password flow, carrying the `username`
 * whose password is being reset alongside shared inputs such as `correlationId`.
 * It is consumed once on the initial `resetPasswordV2` call; later steps are
 * driven by the continuation token. Scopes are supplied at the terminal sign-in,
 * not here.
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

/**
 * Inputs for signing the user in after a V2 password reset completes. The
 * continuation that identifies the just-reset user is held by the
 * `SignInAfterResetPasswordState`, so only the optional `scopes` and `claims`
 * requested for the issued token are supplied here.
 */
export type SignInAfterResetPasswordInputs = CustomAuthActionInputs & {
    scopes?: Array<string>;
    claims?: string;
};
