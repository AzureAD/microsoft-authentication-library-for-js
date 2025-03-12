/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UserAccountAttributes } from "./UserAccountAttributes.js";

/**
 * Inputs for custom auth actions
 */
export type CustomAuthActionInputs = {
    correlationId?: string;
};

/**
 * Inputs for account retrieval action
 */
export type AccountRetrievalInputs = CustomAuthActionInputs;

/**
 * Inputs for sign-in action
 */
export type SignInInputs = CustomAuthActionInputs & {
    username: string;
    password?: string;
    scopes?: Array<string>;
};

/**
 * Inputs for sign-up action
 */
export type SignUpInputs = CustomAuthActionInputs & {
    username: string;
    password?: string;
    attributes?: UserAccountAttributes;
};

/**
 * Inputs for reset password action
 */
export type ResetPasswordInputs = CustomAuthActionInputs & {
    username: string;
};

/**
 * Inputs for access token retrieval action
 */
export type AccessTokenRetrievalInputs = {
    forceRefresh: boolean;
    scopes?: Array<string>;
};

/**
 * Inputs for sign-in with continuation token action
 */
export type SignInWithContinuationTokenInputs = {
    scopes?: Array<string>;
};
