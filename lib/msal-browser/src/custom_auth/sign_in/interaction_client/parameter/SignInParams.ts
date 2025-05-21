/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInScenario } from "../../auth_flow/SignInScenario.js";

export interface SignInParamsBase {
    clientId: string;
    correlationId: string;
    challengeType: Array<string>;
    username: string;
}

export interface SignInResendCodeParams extends SignInParamsBase {
    continuationToken: string;
}

export interface SignInStartParams extends SignInParamsBase {
    password?: string;
}

export interface SignInSubmitCodeParams extends SignInParamsBase {
    continuationToken: string;
    code: string;
    scopes: Array<string>;
}

export interface SignInSubmitPasswordParams extends SignInParamsBase {
    continuationToken: string;
    password: string;
    scopes: Array<string>;
}

export interface SignInContinuationTokenParams extends SignInParamsBase {
    continuationToken: string;
    signInScenario: SignInScenario;
    scopes: Array<string>;
}
