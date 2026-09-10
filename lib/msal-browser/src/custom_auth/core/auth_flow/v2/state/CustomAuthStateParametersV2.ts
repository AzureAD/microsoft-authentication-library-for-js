/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateParameters } from "../../AuthFlowState.js";
import { AuthenticationMethodV2 } from "../AuthenticationMethodV2.js";
import { FlowContinuationStateV2 } from "../../../interaction_client/v2/FlowContinuationStateV2.js";
import { FlowInteractionClientV2 } from "../../../interaction_client/v2/FlowInteractionClientV2.js";
import { CustomAuthSilentCacheClient } from "../../../../get_account/interaction_client/CustomAuthSilentCacheClient.js";
import type { SignUpStateTransitionHandlerV2 } from "../../../../sign_up/auth_flow/v2/state/SignUpStateTransitionHandlerV2.js";
import type { SignInStateTransitionHandlerV2 } from "../../../../sign_in/auth_flow/v2/state/SignInStateTransitionHandlerV2.js";

export interface CustomAuthActionRequiredStateParametersV2
    extends AuthFlowActionRequiredStateParameters {
    flowClient: FlowInteractionClientV2;
    continuationState: FlowContinuationStateV2;
    cacheClient: CustomAuthSilentCacheClient;
}

export interface AuthMethodSelectionRequiredStateParametersV2
    extends CustomAuthActionRequiredStateParametersV2 {
    methods: readonly AuthenticationMethodV2[];
}

export interface MFARequiredStateParametersV2
    extends CustomAuthActionRequiredStateParametersV2 {
    signInStateTransitionHandler?: SignInStateTransitionHandlerV2;
    signUpStateTransitionHandler?: SignUpStateTransitionHandlerV2;
    methods: readonly AuthenticationMethodV2[];
}

export interface ChallengeVerificationRequiredStateParametersV2
    extends CustomAuthActionRequiredStateParametersV2 {
    signInStateTransitionHandler?: SignInStateTransitionHandlerV2;
    signUpStateTransitionHandler?: SignUpStateTransitionHandlerV2;
    method?: AuthenticationMethodV2;
    sentTo?: string;
    channel?: string;
    codeLength?: number;
}
