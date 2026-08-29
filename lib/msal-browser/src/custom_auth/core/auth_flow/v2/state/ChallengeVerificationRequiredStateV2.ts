/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import { AuthenticationMethodV2 } from "../AuthenticationMethodV2.js";
import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import { VerifyChallengeErrorV2 } from "../error/VerifyChallengeErrorV2.js";
import { RequestChallengeErrorV2 } from "../error/RequestChallengeErrorV2.js";
import { NewPasswordRequiredStateV2 } from "../../../../reset_password/auth_flow/v2/state/NewPasswordRequiredStateV2.js";
import type { ChallengeVerificationRequiredStateParametersV2 } from "./CustomAuthStateParametersV2.js";
import type { VerifyChallengeResultV2 } from "../result/VerifyChallengeResultV2.js";
import type { RequestChallengeResultV2 } from "../result/RequestChallengeResultV2.js";
import { CompletedStateV2 } from "./CompletedStateV2.js";
import { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import {
    FLOW_ATTRIBUTES_REQUIRED_V2,
    FLOW_COMPLETED_V2,
    FLOW_NEW_PASSWORD_REQUIRED_V2,
    FLOW_PASSWORD_REQUIRED_V2,
    FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
} from "../../../interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthError } from "../../../error/CustomAuthError.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { AttributesRequiredStateV2 } from "../../../../sign_up/auth_flow/v2/state/AttributesRequiredStateV2.js";
import { SignInContinuationStateV2 } from "../../../../sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import { SignUpPasswordRequiredStateV2 } from "../../../../sign_up/auth_flow/v2/state/SignUpPasswordRequiredStateV2.js";

/**
 * State returned when the user must verify a challenge, for example by
 * submitting a one-time code sent to their email. It carries metadata about the
 * challenge and lets the app submit the code or request a fresh one.
 */
export class ChallengeVerificationRequiredStateV2 extends AuthFlowActionRequiredStateBase<ChallengeVerificationRequiredStateParametersV2> {
    readonly stateType = "challengeVerificationRequired";

    readonly method?: AuthenticationMethodV2;

    readonly sentTo?: string;

    readonly channel?: string;

    readonly codeLength?: number;

    constructor(
        stateParameters: ChallengeVerificationRequiredStateParametersV2
    ) {
        super(stateParameters);
        this.method = stateParameters.method;
        this.sentTo = stateParameters.sentTo;
        this.channel = stateParameters.channel;
        this.codeLength = stateParameters.codeLength;
    }

    /**
     * Verifies the challenge with the code the user received. On success the
     * result requests the next required action; failures identify invalid codes.
     * @param code - The code to verify.
     * @returns The result of verifying the challenge.
     */
    async verifyChallenge(code: string): Promise<VerifyChallengeResultV2> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            if (this.stateParameters.codeLength) {
                this.ensureCodeIsValid(code, this.stateParameters.codeLength);
            }

            logger.verbose("Verifying V2 challenge code.", correlationId);

            const result = await flowClient.submitCode({
                correlationId,
                continuationState,
                code,
            });
            const resultType: string = result.type;

            if (result.type === FLOW_NEW_PASSWORD_REQUIRED_V2) {
                return new CustomAuthResultV2(
                    new NewPasswordRequiredStateV2({
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

            if (result.type === FLOW_ATTRIBUTES_REQUIRED_V2) {
                return new CustomAuthResultV2(
                    new AttributesRequiredStateV2({
                        correlationId: result.correlationId,
                        logger,
                        config: this.stateParameters.config,
                        flowClient,
                        continuationState: result.continuationState,
                        cacheClient: this.stateParameters.cacheClient,
                        attributes: result.attributes,
                    }),
                    undefined,
                    result.continuationState.scenario
                );
            }

            if (result.type === FLOW_PASSWORD_REQUIRED_V2) {
                return new CustomAuthResultV2(
                    new SignUpPasswordRequiredStateV2({
                        correlationId: result.correlationId,
                        logger,
                        config: this.stateParameters.config,
                        flowClient,
                        continuationState: result.continuationState,
                        cacheClient: this.stateParameters.cacheClient,
                        attributes: result.attributes,
                        requiredPasswordAttribute:
                            result.requiredPasswordAttribute,
                    }),
                    undefined,
                    result.continuationState.scenario
                );
            }

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

            if (result.type === FLOW_COMPLETED_V2) {
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
            }

            throw new CustomAuthError(
                UNSUPPORTED_FLOW_TRANSITION,
                `Challenge verification result type '${resultType}' is not supported.`,
                correlationId
            );
        } catch (error) {
            logger.errorPii(
                `Failed to verify V2 challenge. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthResultV2.createWithError(error, {
                errorType: VerifyChallengeErrorV2,
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }

    /**
     * Requests a new challenge when the previous code was not received or expired.
     * The returned result contains the newly issued challenge details.
     * @returns The result of requesting a new challenge.
     */
    async requestNewChallenge(): Promise<RequestChallengeResultV2> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            logger.verbose("Resending V2 challenge code.", correlationId);

            const result = await flowClient.resendCode({
                correlationId,
                continuationState,
            });

            return new CustomAuthResultV2(
                new ChallengeVerificationRequiredStateV2({
                    correlationId: result.correlationId,
                    logger,
                    config: this.stateParameters.config,
                    flowClient,
                    continuationState: result.continuationState,
                    cacheClient: this.stateParameters.cacheClient,
                    method: this.method,
                    sentTo: result.sentTo,
                    channel: result.channel,
                    codeLength: result.codeLength,
                }),
                undefined,
                result.continuationState.scenario
            );
        } catch (error) {
            logger.errorPii(
                `Failed to resend V2 challenge. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthResultV2.createWithError(error, {
                errorType: RequestChallengeErrorV2,
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
