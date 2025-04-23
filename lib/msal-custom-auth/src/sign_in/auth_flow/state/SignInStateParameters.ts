/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInClient } from "../../interaction_client/SignInClient.js";
import { CustomAuthSilentCacheClient } from "../../../get_account/interaction_client/CustomAuthSilentCacheClient.js";
import { AuthFlowActionRequiredStateParameters } from "../../../core/auth_flow/AuthFlowState.js";
import { UserAttribute } from "../../../core/network_client/custom_auth_api/types/ApiErrorResponseTypes.js";

export interface SignInStateParameters extends AuthFlowActionRequiredStateParameters {
    username: string;
    signInClient: SignInClient;
    cacheClient: CustomAuthSilentCacheClient;
}

export type SignInPasswordRequiredStateParameters = SignInStateParameters;

export interface SignInCodeRequiredStateParameters extends SignInStateParameters {
    codeLength: number;
    codeResendInterval: number;
}

export interface SignInAttributesRequiredStateParameters extends SignInStateParameters {
    requiredAttributes: Array<UserAttribute>;
}
