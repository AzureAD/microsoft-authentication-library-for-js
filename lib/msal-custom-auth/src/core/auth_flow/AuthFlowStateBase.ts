/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-browser";
import { CustomAuthBrowserConfiguration } from "../../configuration/CustomAuthConfiguration.js";

/*
 * Base state for the auth flow.
 */
export class AuthFlowStateBase {
    constructor(
        public type:
            | SignInState
            | SignUpState
            | ResetPasswordState
            | GetAccountState
            | GetAccessTokenState
            | SignOutState,
        protected correlationId: string,
        protected continuationToken: string,
        protected logger: Logger,
        protected config: CustomAuthBrowserConfiguration,
    ) {}
}

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
