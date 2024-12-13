/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { UserAccountAttributes } from "./UserAccountAttributes.js";

export type GetAccountInputs = NativeAuthActionInputs;

export type SignInInputs = NativeAuthActionInputs & {
    username: string;
    password?: string;
    scopes?: Array<string>;
};

export type SignUpInputs = NativeAuthActionInputs & {
    username: string;
    password?: string;
    attribute?: UserAccountAttributes;
};

export type ResetPasswordInputs = NativeAuthActionInputs & {
    username: string;
};

export type NativeAuthActionInputs = {
    correlationId?: string;
};
