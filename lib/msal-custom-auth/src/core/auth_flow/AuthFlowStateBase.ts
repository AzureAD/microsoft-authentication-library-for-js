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
        public correlationId?: string,
        public continuationToken?: string,
        public logger?: Logger,
        public config?: CustomAuthBrowserConfiguration,
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
