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

/*
 * Shared parameters for every native auth V2 action-required state. Beyond the base (correlation
 * id, logger, config), each V2 state carries the generic `V2FlowInteractionClient` it drives, the
 * opaque `continuationState` (token + scenario + next-step hrefs) produced by the previous step,
 * and the `cacheClient` used to build the account on completion.
 */
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

/**
 * Parameters for the sign-in-after-reset-password state. Carries the reset-flow
 * continuation (inherited) that authorizes the follow-up sign-in, plus the
 * `username` of the just-reset account so the issued tokens are associated with
 * the right user.
 */
export interface SignInAfterResetPasswordStateParameters
    extends CustomAuthV2ActionRequiredStateParameters {
    username?: string;
}
