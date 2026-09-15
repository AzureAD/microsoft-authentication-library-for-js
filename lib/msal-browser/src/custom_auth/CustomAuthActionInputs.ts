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

export type SignInInputsV2 = SignInInputs;

export type ResetPasswordInputsV2 = ResetPasswordInputs;

export type SignUpInputsV2 = SignUpInputs & {
    scopes?: Array<string>;
    claims?: string;
};

export type SignInContinuationInputsV2 =
    SignInWithContinuationTokenInputs;
