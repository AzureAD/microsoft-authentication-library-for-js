/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/*
 * Base state for the auth flow.
 */
export abstract class AuthFlowStateBase {
    constructor(
        public type:
            | SignInState
            | SignUpState
            | ResetPasswordState
            | GetAccountState
            | GetAccessTokenState
            | SignOutState,
    ) {}
}

export enum SignInState {
    CodeRequired,
    PasswordRequired,
    Completed,
    Failed,
}

export enum SignOutState {
    Completed,
    Failed,
}

export enum SignUpState {
    CodeRequired,
    PasswordRequired,
    AttributesRequired,
    Completed,
    Failed,
}

export enum ResetPasswordState {
    CodeRequired,
    PasswordRequired,
    Completed,
    Failed,
}

export enum GetAccountState {
    Completed,
    Failed,
}

export enum GetAccessTokenState {
    Completed,
    Failed,
}
