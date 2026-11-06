/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import type { AuthMethodRegistrationChallengeResultV2 } from "../result/AuthMethodRegistrationChallengeResultV2.js";
import type { AuthMethodVerificationSubmitChallengeResultV2 } from "../result/AuthMethodVerificationSubmitChallengeResultV2.js";
import type { AuthMethodVerificationRequiredStateParametersV2 } from "./CustomAuthStateParametersV2.js";
import { CompletedStateV2 } from "./CompletedStateV2.js";
import { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import { ensureArgumentIsNotNullOrUndefined } from "../../../utils/ArgumentValidator.js";
import { FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2 } from "../../../interaction_client/v2/result/FlowActionResultV2.js";
import { SignInContinuationStateV2 } from "../../../../sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";

/**
 * State returned when a newly registered authentication method must be
 * activated with the challenge sent by the service.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export class AuthMethodVerificationRequiredStateV2 extends AuthFlowActionRequiredStateBase<AuthMethodVerificationRequiredStateParametersV2> {
    readonly stateType = "authMethodVerificationRequired";
    readonly type: string;
    readonly sentTo?: string;
    readonly codeLength: number;

    constructor(
        stateParameters: AuthMethodVerificationRequiredStateParametersV2
    ) {
        super(stateParameters);
        this.type = stateParameters.type;
        this.sentTo = stateParameters.sentTo;
        this.codeLength = stateParameters.codeLength;
    }

    /**
     * Submits the activation challenge for the registered method.
     * @param challenge - The activation challenge to submit.
     * @returns A sign-in continuation, completed authentication result, or failed state.
     */
    async submitChallenge(
        challenge: string
    ): Promise<AuthMethodVerificationSubmitChallengeResultV2> {
        const { correlationId, continuationState, flowClient, logger } =
            this.stateParameters;

        try {
            ensureArgumentIsNotNullOrUndefined(
                "challenge",
                challenge,
                correlationId
            );
            logger.verbose(
                "Submitting a V2 authentication-method activation challenge.",
                correlationId
            );
            const result = await flowClient.verifyAuthMethodRegistration({
                correlationId,
                continuationState,
                code: challenge,
            });

            if (result.type === FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2) {
                return new CustomAuthResultV2(
                    new SignInContinuationStateV2({
                        correlationId: result.correlationId,
                        logger,
                        config: this.stateParameters.config,
                        flowClient,
                        continuationState: result.continuationState,
                        cacheClient: this.stateParameters.cacheClient,
                    }),
                    undefined,
                    result.continuationState.scenario
                );
            }

            const account = new CustomAuthAccountData(
                result.authenticationResult.account,
                this.stateParameters.config,
                this.stateParameters.cacheClient,
                logger,
                correlationId
            );

            return new CustomAuthResultV2(
                new CompletedStateV2(),
                account,
                continuationState.scenario
            );
        } catch (error) {
            logger.errorPii(
                `Failed to submit the V2 authentication-method activation challenge. Error: '${error}'.`,
                correlationId
            );
            return CustomAuthResultV2.createWithError(error, {
                scenario: continuationState.scenario,
                correlationId,
                errorContext: "authMethodRegistration",
            });
        }
    }

    /**
     * Requests a replacement activation challenge for the registered method.
     * @returns Refreshed activation metadata or a failed state.
     */
    async resendChallenge(): Promise<AuthMethodRegistrationChallengeResultV2> {
        const { correlationId, continuationState, flowClient, logger } =
            this.stateParameters;

        try {
            logger.verbose(
                "Resending a V2 authentication-method activation challenge.",
                correlationId
            );
            const result =
                await flowClient.resendAuthMethodRegistrationChallenge({
                    correlationId,
                    continuationState,
                });

            return new CustomAuthResultV2(
                new AuthMethodVerificationRequiredStateV2({
                    correlationId: result.correlationId,
                    logger,
                    config: this.stateParameters.config,
                    flowClient,
                    cacheClient: this.stateParameters.cacheClient,
                    continuationState: result.continuationState,
                    type: this.type,
                    sentTo: result.sentTo ?? this.sentTo,
                    codeLength: result.codeLength,
                }),
                undefined,
                result.continuationState.scenario
            );
        } catch (error) {
            logger.errorPii(
                `Failed to resend the V2 authentication-method activation challenge. Error: '${error}'.`,
                correlationId
            );
            return CustomAuthResultV2.createWithError(error, {
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
