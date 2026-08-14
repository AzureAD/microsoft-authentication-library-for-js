/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateParameters } from "../../AuthFlowState.js";
import { AuthenticationMethodV2 } from "../AuthenticationMethodV2.js";
import { V2FlowContinuationState } from "../../../interaction_client/v2/V2FlowContinuationState.js";
import { V2FlowInteractionClient } from "../../../interaction_client/v2/V2FlowInteractionClient.js";
import { V2FlowMethod } from "../../../interaction_client/v2/result/V2FlowActionResult.js";
import { CustomAuthSilentCacheClient } from "../../../../get_account/interaction_client/CustomAuthSilentCacheClient.js";

export interface CustomAuthV2ActionRequiredStateParameters
    extends AuthFlowActionRequiredStateParameters {
    flowClient: V2FlowInteractionClient;
    continuationState: V2FlowContinuationState;
    cacheClient: CustomAuthSilentCacheClient;
}

export interface AuthenticationMethodSelectionRequiredStateParameters
    extends CustomAuthV2ActionRequiredStateParameters {
    methods: readonly V2FlowMethod[];
}

export interface ChallengeVerificationRequiredStateParameters
    extends CustomAuthV2ActionRequiredStateParameters {
    method: AuthenticationMethodV2;
    sentTo?: string;
    channel?: string;
    codeLength?: number;
}

export type NewPasswordRequiredStateParameters =
    CustomAuthV2ActionRequiredStateParameters;

export interface SignInAfterResetPasswordStateParameters
    extends CustomAuthV2ActionRequiredStateParameters {
    username?: string;
}
