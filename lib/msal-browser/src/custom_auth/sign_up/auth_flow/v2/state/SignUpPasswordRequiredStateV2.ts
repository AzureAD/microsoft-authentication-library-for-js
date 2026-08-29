/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { SignUpAttributeV2 } from "../../../../core/network_client/custom_auth_api/v2/result/SignUpResultsV2.js";
import type { UserAccountAttributes } from "../../../../UserAccountAttributes.js";
import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import { ChallengeVerificationRequiredStateV2 } from "../../../../core/auth_flow/v2/state/ChallengeVerificationRequiredStateV2.js";
import { CustomAuthError } from "../../../../core/error/CustomAuthError.js";
import {
    FLOW_CODE_REQUIRED_V2,
    FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
} from "../../../../core/interaction_client/v2/result/FlowActionResultV2.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../../core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { SignInContinuationStateV2 } from "../../../../sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import { SubmitAttributesErrorV2 } from "../error_type/SubmitAttributesErrorV2.js";
import type { SubmitAttributesResultV2 } from "../result/SubmitAttributesResultV2.js";
import { SignUpAttributesRequiredStateBaseV2 } from "./SignUpAttributesRequiredStateBaseV2.js";
import type { SignUpPasswordRequiredStateParametersV2 } from "./SignUpStateParametersV2.js";

/**
 * State returned when sign-up requires a password that was not submitted with
 * an earlier attribute request.
 */
export class SignUpPasswordRequiredStateV2 extends SignUpAttributesRequiredStateBaseV2<SignUpPasswordRequiredStateParametersV2> {
    readonly stateType = "passwordRequired";

    readonly requiredPasswordAttribute: SignUpAttributeV2;

    constructor(stateParameters: SignUpPasswordRequiredStateParametersV2) {
        super(stateParameters);
        this.requiredPasswordAttribute =
            stateParameters.requiredPasswordAttribute;
    }

    /**
     * Submits the password and any profile attributes requested alongside it.
     */
    async submitPassword(
        password: string,
        attributes: UserAccountAttributes = {}
    ): Promise<SubmitAttributesResultV2> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            this.ensurePasswordIsNotEmpty(password);
            const result = await this.submitAttributesAction({
                ...attributes,
                password,
            });
            const resultType: string = result.type;
            const commonStateParameters = {
                correlationId: result.correlationId,
                logger,
                config: this.stateParameters.config,
                flowClient,
                continuationState: result.continuationState,
                cacheClient: this.stateParameters.cacheClient,
            };

            if (result.type === FLOW_CODE_REQUIRED_V2) {
                return new CustomAuthResultV2(
                    new ChallengeVerificationRequiredStateV2({
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
                `Sign-up password submission result type '${resultType}' is not supported.`,
                correlationId
            );
        } catch (error) {
            logger.errorPii(
                `Failed to submit V2 sign-up password. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthResultV2.createWithError(error, {
                errorType: SubmitAttributesErrorV2,
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
