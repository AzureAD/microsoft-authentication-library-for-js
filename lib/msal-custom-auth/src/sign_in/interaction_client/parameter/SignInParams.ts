/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export interface SignInParamsBase {
    clientId: string;
    challengeType: Array<string>;
    username: string;
    correlationId: string;
}

export interface SignInStartParams extends SignInParamsBase {
    password?: string;
}

export interface SignInResendCodeParams extends SignInParamsBase {
    continuationToken: string;
}

export interface SignInContinueParams extends SignInParamsBase {
    continuationToken: string;
}

export interface SignInSubmitCodeParams extends SignInContinueParams {
    code: string;
}

export interface SignInSubmitPasswordParams extends SignInContinueParams {
    password: string;
}
