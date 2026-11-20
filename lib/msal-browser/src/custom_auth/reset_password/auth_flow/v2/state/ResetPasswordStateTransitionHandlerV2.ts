/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { VerifyChallengeResultV2 } from "../../../../core/auth_flow/v2/result/VerifyChallengeResultV2.js";
import type { CustomAuthActionRequiredStateParametersV2 } from "../../../../core/auth_flow/v2/state/CustomAuthStateParametersV2.js";
import type { FlowNewPasswordRequiredResultV2 } from "../../../../core/interaction_client/v2/result/FlowActionResultV2.js";
import { NewPasswordRequiredStateV2 } from "./NewPasswordRequiredStateV2.js";

export class ResetPasswordStateTransitionHandlerV2 {
    handleNewPasswordRequired(
        result: FlowNewPasswordRequiredResultV2,
        stateParameters: CustomAuthActionRequiredStateParametersV2
    ): VerifyChallengeResultV2 {
        return new CustomAuthResultV2(
            new NewPasswordRequiredStateV2({
                correlationId: result.correlationId,
                logger: stateParameters.logger,
                config: stateParameters.config,
                flowClient: stateParameters.flowClient,
                continuationState: result.continuationState,
                cacheClient: stateParameters.cacheClient,
            }),
            undefined,
            result.continuationState.scenario
        );
    }
}
