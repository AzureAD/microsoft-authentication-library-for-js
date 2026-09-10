/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import { CodeRequiredStateV2 } from "../../../../core/auth_flow/v2/state/CodeRequiredStateV2.js";
import { CustomAuthError } from "../../../../core/error/CustomAuthError.js";
import {
    FLOW_ATTRIBUTES_REQUIRED_V2,
    FLOW_CODE_REQUIRED_V2,
    FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
    type FlowAttributesRequiredResultV2,
    type FlowSignUpActionResultV2,
    type FlowSignUpPasswordRequiredResultV2,
} from "../../../../core/interaction_client/v2/result/FlowActionResultV2.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../../core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { SignInContinuationStateV2 } from "../../../../sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import type { VerifyChallengeResultV2 } from "../../../../core/auth_flow/v2/result/VerifyChallengeResultV2.js";
import type { SubmitAttributesResultV2 } from "../result/SubmitAttributesResultV2.js";
import { AttributesRequiredStateV2 } from "./AttributesRequiredStateV2.js";
import { SignUpPasswordRequiredStateV2 } from "./SignUpPasswordRequiredStateV2.js";
import type { SignUpActionRequiredStateParametersV2 } from "./SignUpStateParametersV2.js";

export class SignUpStateTransitionHandlerV2 {
    handleAttributeSubmission(
        result: FlowSignUpActionResultV2,
        stateParameters: SignUpActionRequiredStateParametersV2,
        submission: "attribute" | "password"
    ): SubmitAttributesResultV2 {
        const commonStateParameters = this.createCommonStateParameters(
            result,
            stateParameters
        );

        if (result.type === FLOW_CODE_REQUIRED_V2) {
            return new CustomAuthResultV2(
                new CodeRequiredStateV2({
                    ...commonStateParameters,
                    sentTo: result.sentTo,
                    channel: result.channel,
                    codeLength: result.codeLength,
                }),
                undefined,
                result.continuationState.scenario
            );
        }

        if (result.type === FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2) {
            return new CustomAuthResultV2(
                new SignInContinuationStateV2(commonStateParameters),
                undefined,
                result.continuationState.scenario
            );
        }

        throw new CustomAuthError(
            UNSUPPORTED_FLOW_TRANSITION,
            `Sign-up ${submission} submission result type '${result.type}' is not supported.`,
            stateParameters.correlationId
        );
    }

    handleVerification(
        result:
            | FlowAttributesRequiredResultV2
            | FlowSignUpPasswordRequiredResultV2,
        stateParameters: SignUpActionRequiredStateParametersV2
    ): VerifyChallengeResultV2 {
        const commonStateParameters = this.createCommonStateParameters(
            result,
            stateParameters
        );

        if (result.type === FLOW_ATTRIBUTES_REQUIRED_V2) {
            return new CustomAuthResultV2(
                new AttributesRequiredStateV2({
                    ...commonStateParameters,
                    attributes: result.attributes,
                }),
                undefined,
                result.continuationState.scenario
            );
        }

        return new CustomAuthResultV2(
            new SignUpPasswordRequiredStateV2({
                ...commonStateParameters,
                attributes: result.attributes,
                requiredPasswordAttribute: result.requiredPasswordAttribute,
            }),
            undefined,
            result.continuationState.scenario
        );
    }

    private createCommonStateParameters(
        result: FlowSignUpActionResultV2,
        stateParameters: SignUpActionRequiredStateParametersV2
    ): SignUpActionRequiredStateParametersV2 {
        return {
            correlationId: result.correlationId,
            logger: stateParameters.logger,
            config: stateParameters.config,
            flowClient: stateParameters.flowClient,
            continuationState: result.continuationState,
            cacheClient: stateParameters.cacheClient,
            signUpStateTransitionHandler:
                stateParameters.signUpStateTransitionHandler,
        };
    }
}
