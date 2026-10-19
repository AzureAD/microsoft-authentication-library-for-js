/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { VerifyChallengeResultV2 } from "../../../../core/auth_flow/v2/result/VerifyChallengeResultV2.js";
import type {
    CodeRequiredStateParametersV2,
    CustomAuthActionRequiredStateParametersV2,
} from "../../../../core/auth_flow/v2/state/CustomAuthStateParametersV2.js";
import { AuthMethodSelectionRequiredStateV2 } from "../../../../core/auth_flow/v2/state/AuthMethodSelectionRequiredStateV2.js";
import type {
    FlowMFARequiredResultV2,
    FlowPasswordRequiredResultV2,
} from "../../../../core/interaction_client/v2/result/FlowActionResultV2.js";
import { AuthenticationFactorV2 } from "../../../../core/network_client/custom_auth_api/v2/result/BaseResultsV2.js";
import { PasswordRequiredStateV2 } from "./PasswordRequiredStateV2.js";
import type { RequestChallengeResultV2 } from "../../../../core/auth_flow/v2/result/RequestChallengeResultV2.js";

export class SignInStateTransitionHandlerV2 {
    handlePasswordRequired(
        result: FlowPasswordRequiredResultV2,
        stateParameters: CustomAuthActionRequiredStateParametersV2
    ): RequestChallengeResultV2 {
        return new CustomAuthResultV2(
            new PasswordRequiredStateV2({
                ...stateParameters,
                correlationId: result.correlationId,
                continuationState: result.continuationState,
            }),
            undefined,
            result.continuationState.scenario
        );
    }

    handleMfaRequired(
        result: FlowMFARequiredResultV2,
        stateParameters: CodeRequiredStateParametersV2
    ): VerifyChallengeResultV2 {
        return new CustomAuthResultV2(
            new AuthMethodSelectionRequiredStateV2({
                correlationId: result.correlationId,
                logger: stateParameters.logger,
                config: stateParameters.config,
                flowClient: stateParameters.flowClient,
                continuationState: result.continuationState,
                cacheClient: stateParameters.cacheClient,
                methods: result.methods,
                authenticationFactor: AuthenticationFactorV2.MULTI_FACTOR,
            }),
            undefined,
            result.continuationState.scenario
        );
    }
}
