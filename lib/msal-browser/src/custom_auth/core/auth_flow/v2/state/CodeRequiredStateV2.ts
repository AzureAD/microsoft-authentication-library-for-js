/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import { VerifyChallengeErrorV2 } from "../error/VerifyChallengeErrorV2.js";
import { RequestChallengeErrorV2 } from "../error/RequestChallengeErrorV2.js";
import { NewPasswordRequiredStateV2 } from "../../../../reset_password/auth_flow/v2/state/NewPasswordRequiredStateV2.js";
import type { CodeRequiredStateParametersV2 } from "./CustomAuthStateParametersV2.js";
import type { VerifyChallengeResultV2 } from "../result/VerifyChallengeResultV2.js";
import type { RequestChallengeResultV2 } from "../result/RequestChallengeResultV2.js";
import { CompletedStateV2 } from "./CompletedStateV2.js";
import { MFARequiredStateV2 } from "./MFARequiredStateV2.js";
import { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import {
    FLOW_ATTRIBUTES_REQUIRED_V2,
    FLOW_COMPLETED_V2,
    FLOW_MFA_REQUIRED_V2,
    FLOW_NEW_PASSWORD_REQUIRED_V2,
    FLOW_SIGN_UP_PASSWORD_REQUIRED_V2,
    FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2,
} from "../../../interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthError } from "../../../error/CustomAuthError.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { SignInContinuationStateV2 } from "../../../../sign_in/auth_flow/v2/state/SignInContinuationStateV2.js";
import { CodeVerificationStateBaseV2 } from "./CodeVerificationStateBaseV2.js";

/**
 * State returned when first-factor email authentication requires a one-time
 * code. It allows the app to submit the code or request a replacement.
 */
export class CodeRequiredStateV2 extends CodeVerificationStateBaseV2<CodeRequiredStateParametersV2> {
    readonly stateType = "codeRequired";

    /**
     * Submits the first-factor email code and advances the active flow. The
     * result may complete the operation or require another flow-specific step.
     * @param code - The code to submit.
     * @returns The result of submitting the first-factor code.
     */
    async submitCode(code: string): Promise<VerifyChallengeResultV2> {
        const { correlationId, logger, continuationState } =
            this.stateParameters;

        try {
            logger.verbose("Submitting V2 first-factor code.", correlationId);
            const result = await this.submitCodeCore(code);
            const resultType: string = result.type;

            if (result.type === FLOW_NEW_PASSWORD_REQUIRED_V2) {
                return new CustomAuthResultV2(
                    new NewPasswordRequiredStateV2({
                        correlationId: result.correlationId,
                        logger,
                        config: this.stateParameters.config,
                        flowClient: this.stateParameters.flowClient,
                        continuationState: result.continuationState,
                        cacheClient: this.stateParameters.cacheClient,
                    }),
                    undefined,
                    result.continuationState.scenario
                );
            }

            if (
                result.type === FLOW_ATTRIBUTES_REQUIRED_V2 ||
                result.type === FLOW_SIGN_UP_PASSWORD_REQUIRED_V2
            ) {
                const signUpStateTransitionHandler =
                    this.stateParameters.signUpStateTransitionHandler;
                if (!signUpStateTransitionHandler) {
                    throw new CustomAuthError(
                        UNSUPPORTED_FLOW_TRANSITION,
                        "Sign-up state transition handler is missing.",
                        correlationId
                    );
                }

                return signUpStateTransitionHandler.handleVerification(result, {
                    ...this.stateParameters,
                    signUpStateTransitionHandler,
                });
            }

            if (result.type === FLOW_SIGN_IN_CONTINUATION_REQUIRED_V2) {
                return new CustomAuthResultV2(
                    new SignInContinuationStateV2({
                        correlationId: result.correlationId,
                        logger,
                        config: this.stateParameters.config,
                        flowClient: this.stateParameters.flowClient,
                        continuationState: result.continuationState,
                        cacheClient: this.stateParameters.cacheClient,
                    }),
                    undefined,
                    result.continuationState.scenario
                );
            }

            if (result.type === FLOW_MFA_REQUIRED_V2) {
                return new CustomAuthResultV2(
                    new MFARequiredStateV2({
                        correlationId: result.correlationId,
                        logger,
                        config: this.stateParameters.config,
                        flowClient: this.stateParameters.flowClient,
                        continuationState: result.continuationState,
                        cacheClient: this.stateParameters.cacheClient,
                        methods: result.methods,
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
                `Code submission result type '${resultType}' is not supported.`,
                correlationId
            );
        } catch (error) {
            logger.errorPii(
                `Failed to submit V2 first-factor code. Error: '${error}'.`,
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
     * Requests a replacement first-factor email code. The returned state
     * contains the refreshed challenge metadata.
     * @returns The result of requesting a replacement code.
     */
    async resendCode(): Promise<RequestChallengeResultV2> {
        const { correlationId, logger, continuationState } =
            this.stateParameters;

        try {
            logger.verbose("Resending V2 first-factor code.", correlationId);
            const result = await this.resendCodeCore();

            return new CustomAuthResultV2(
                new CodeRequiredStateV2({
                    correlationId: result.correlationId,
                    logger,
                    config: this.stateParameters.config,
                    flowClient: this.stateParameters.flowClient,
                    continuationState: result.continuationState,
                    cacheClient: this.stateParameters.cacheClient,
                    signUpStateTransitionHandler:
                        this.stateParameters.signUpStateTransitionHandler,
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
                `Failed to resend V2 first-factor code. Error: '${error}'.`,
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
