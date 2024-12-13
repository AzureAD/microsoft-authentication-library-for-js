/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export enum SignInState {
    CodeRequired,
    PasswordRequired,
    Completed,
    Failed,
    Unknown,
}

export enum SignOutState {
    Completed,
    Error,
}

export enum SignUpState {
    CodeRequired,
    PasswordRequired,
    AttributesRequired,
    Completed,
    Failed,
    Unknown,
}

export enum ResetPasswordState {
    CodeRequired,
    PasswordRequired,
    Completed,
    Failed,
    Unknown,
}

export enum GetAccountState {
    Completed,
    Failed,
    Unknown,
}

export enum GetAccessTokenState {
    Completed,
    Failed,
    Unknown,
}
