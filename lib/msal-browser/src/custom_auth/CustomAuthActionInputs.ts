/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UserAccountAttributes } from "./UserAccountAttributes.js";

export type CustomAuthActionInputs = {
    correlationId?: string;
};

export type AccountRetrievalInputs = CustomAuthActionInputs;

export type SignInInputs = CustomAuthActionInputs & {
    username: string;
    password?: string;
    scopes?: Array<string>;
    claims?: string;
};

export type SignUpInputs = CustomAuthActionInputs & {
    username: string;
    password?: string;
    attributes?: UserAccountAttributes;
};

export type ResetPasswordInputs = CustomAuthActionInputs & {
    username: string;
};

export type AccessTokenRetrievalInputs = {
    forceRefresh: boolean;
    scopes?: Array<string>;
    claims?: string;
};

export type SignInWithContinuationTokenInputs = {
    scopes?: Array<string>;
    claims?: string;
};

/**
 * Inputs for starting native auth V2 sign-in for a username.
 * The input contract is shared with V1, including optional password, scopes, and claims.
 */
export type SignInInputsV2 = SignInInputs;

/**
 * Inputs for starting native auth V2 password reset for a username.
 * Optional scopes and claims are carried through the flow to token acquisition.
 */
export type ResetPasswordInputsV2 = CustomAuthActionInputs & {
    username: string;
    scopes?: Array<string>;
    claims?: string;
};

/**
 * Inputs for starting native auth V2 sign-up with email verification.
 * Submit requested profile attributes through subsequent states; optional scopes and claims are carried through to token acquisition.
 */
export type SignUpInputsV2 = CustomAuthActionInputs & {
    username: string;
    attributes?: UserAccountAttributes;
    scopes?: Array<string>;
    claims?: string;
};
