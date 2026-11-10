/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import { CustomAuthError } from "../../../../core/error/CustomAuthError.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../../core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import {
    FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
    FLOW_COMPLETED_V2,
    FLOW_MFA_REQUIRED_V2,
    type FlowAuthMethodRegistrationRequiredResultV2,
    type FlowCompletedResultV2,
    type FlowMFARequiredResultV2,
} from "../../../../core/interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import { AuthMethodRegistrationRequiredStateV2 } from "../../../../core/auth_flow/v2/state/AuthMethodRegistrationRequiredStateV2.js";
import { CompletedStateV2 } from "../../../../core/auth_flow/v2/state/CompletedStateV2.js";
import type { CustomAuthActionRequiredStateParametersV2 } from "../../../../core/auth_flow/v2/state/CustomAuthStateParametersV2.js";
import type {
    ExistingAccountSubmitCodeResultV2,
    ExistingAccountSubmitPasswordResultV2,
} from "../result/ExistingAccountActionResultsV2.js";

type ExistingAccountVerificationResultV2 =
    | FlowMFARequiredResultV2
    | FlowAuthMethodRegistrationRequiredResultV2
    | FlowCompletedResultV2;

export function handleExistingAccountVerificationResultV2(
    result: ExistingAccountVerificationResultV2,
    stateParameters: CustomAuthActionRequiredStateParametersV2
): ExistingAccountSubmitCodeResultV2 | ExistingAccountSubmitPasswordResultV2 {
    const commonStateParameters = {
        correlationId: result.correlationId,
        logger: stateParameters.logger,
        config: stateParameters.config,
        flowClient: stateParameters.flowClient,
        continuationState:
            "continuationState" in result
                ? result.continuationState
                : stateParameters.continuationState,
        cacheClient: stateParameters.cacheClient,
    };

    if (result.type === FLOW_COMPLETED_V2) {
        const account = new CustomAuthAccountData(
            result.authenticationResult.account,
            stateParameters.config,
            stateParameters.cacheClient,
            stateParameters.logger,
            result.correlationId
        );
        return new CustomAuthResultV2(
            new CompletedStateV2(),
            account,
            stateParameters.continuationState.scenario
        );
    }

    if (result.type === FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2) {
        return new CustomAuthResultV2(
            new AuthMethodRegistrationRequiredStateV2({
                ...commonStateParameters,
                continuationState: result.continuationState,
                methods: result.methods,
            }),
            undefined,
            result.continuationState.scenario
        );
    }

    if (result.type === FLOW_MFA_REQUIRED_V2) {
        const signInStateTransitionHandler =
            stateParameters.signInStateTransitionHandler;
        if (!signInStateTransitionHandler) {
            throw new CustomAuthError(
                UNSUPPORTED_FLOW_TRANSITION,
                "Sign-in state transition handler is missing.",
                stateParameters.correlationId
            );
        }

        return signInStateTransitionHandler.handleMfaRequired(
            result,
            stateParameters
        );
    }

    const resultType = (result as { type: string }).type;
    throw new CustomAuthError(
        UNSUPPORTED_FLOW_TRANSITION,
        `Existing-account verification result type '${resultType}' is not supported.`,
        stateParameters.correlationId
    );
}
