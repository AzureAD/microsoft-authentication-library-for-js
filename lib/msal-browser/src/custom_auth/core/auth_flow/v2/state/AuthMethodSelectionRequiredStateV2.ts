/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthenticationMethodV2 } from "../AuthenticationMethodV2.js";
import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import { CodeRequiredStateV2 } from "./CodeRequiredStateV2.js";
import { MFAVerificationRequiredStateV2 } from "./MFAVerificationRequiredStateV2.js";
import type { AuthMethodSelectionRequiredStateParametersV2 } from "./CustomAuthStateParametersV2.js";
import type { RequestChallengeResultV2 } from "../result/RequestChallengeResultV2.js";
import {
    FLOW_CODE_REQUIRED_V2,
    FLOW_PASSWORD_REQUIRED_V2,
    type FlowCodeRequiredResultV2,
    type FlowPasswordRequiredResultV2,
} from "../../../interaction_client/v2/result/FlowActionResultV2.js";
import { AuthenticationMethodTypeV2 } from "../../../network_client/custom_auth_api/v2/ApiClientConstantsV2.js";
import { CustomAuthError } from "../../../error/CustomAuthError.js";
import { InvalidArgumentError } from "../../../error/InvalidArgumentError.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { AuthenticationFactorV2 } from "../../../network_client/custom_auth_api/v2/result/BaseResultsV2.js";
import { CustomAuthFlowScenarioV2 } from "../CustomAuthFlowScenarioV2.js";

/**
 * State returned when the user must select one of several authentication
 * methods before a challenge can be issued. It exposes the list of offered
 * methods and lets the app request a challenge for the chosen one. The flow
 * stays on this state until a challenge is successfully requested.
 */
export class AuthMethodSelectionRequiredStateV2 extends AuthFlowActionRequiredStateBase<AuthMethodSelectionRequiredStateParametersV2> {
    readonly stateType = "authMethodSelectionRequired";
    readonly methods: readonly AuthenticationMethodV2[];

    constructor(stateParameters: AuthMethodSelectionRequiredStateParametersV2) {
        super(stateParameters);
        this.methods = stateParameters.methods;
    }

    /**
     * Selects an authentication method and requests its challenge. The returned
     * state identifies the credential the application must collect.
     * @param method - The method to select, from {@link methods}.
     * @returns The result of selecting the method and requesting its challenge.
     */
    async selectAuthMethod(
        method: AuthenticationMethodV2
    ): Promise<RequestChallengeResultV2> {
        const {
            authenticationFactor,
            correlationId,
            logger,
            continuationState,
            flowClient,
            signInStateTransitionHandler,
        } = this.stateParameters;

        try {
            logger.verbose(
                "Requesting challenge for the selected V2 method.",
                correlationId
            );

            const { result, selectedMethod } =
                await this.requestSelectedMethodChallenge(method);

            const commonStateParameters = {
                correlationId: result.correlationId,
                logger,
                config: this.stateParameters.config,
                flowClient,
                continuationState: result.continuationState,
                cacheClient: this.stateParameters.cacheClient,
            };

            if (
                authenticationFactor === AuthenticationFactorV2.SINGLE_FACTOR &&
                result.type === FLOW_CODE_REQUIRED_V2 &&
                (result.channel?.toLowerCase() ===
                    AuthenticationMethodTypeV2.EMAIL ||
                    result.channel?.toLowerCase() ===
                        AuthenticationMethodTypeV2.SMS)
            ) {
                return new CustomAuthResultV2(
                    new CodeRequiredStateV2({
                        ...commonStateParameters,
                        signInStateTransitionHandler,
                        method: selectedMethod,
                        sentTo: result.sentTo,
                        channel: result.channel,
                        codeLength: result.codeLength,
                    }),
                    undefined,
                    result.continuationState.scenario
                );
            }

            if (
                continuationState.scenario ===
                    CustomAuthFlowScenarioV2.SignIn &&
                authenticationFactor === AuthenticationFactorV2.SINGLE_FACTOR &&
                result.type === FLOW_PASSWORD_REQUIRED_V2
            ) {
                if (!signInStateTransitionHandler) {
                    throw new CustomAuthError(
                        UNSUPPORTED_FLOW_TRANSITION,
                        "Sign-in method selection cannot map a password challenge without a sign-in transition handler.",
                        correlationId
                    );
                }

                return signInStateTransitionHandler.handlePasswordRequired(
                    result,
                    commonStateParameters
                );
            }

            if (
                authenticationFactor === AuthenticationFactorV2.MULTI_FACTOR &&
                result.type === FLOW_CODE_REQUIRED_V2
            ) {
                return new CustomAuthResultV2(
                    new MFAVerificationRequiredStateV2({
                        ...commonStateParameters,
                        method: selectedMethod,
                        sentTo: result.sentTo,
                        channel: result.channel,
                        codeLength: result.codeLength,
                    }),
                    undefined,
                    result.continuationState.scenario
                );
            }

            const expectedChallenge =
                authenticationFactor === AuthenticationFactorV2.SINGLE_FACTOR
                    ? continuationState.scenario ===
                      CustomAuthFlowScenarioV2.SignIn
                        ? "an email or SMS code challenge or a password challenge for single-factor sign-in"
                        : "an email or SMS code challenge for single-factor authentication"
                    : "a code challenge for multi-factor authentication";
            const returnedChallenge =
                result.type === FLOW_CODE_REQUIRED_V2
                    ? result.channel
                        ? `a '${result.channel}' code challenge`
                        : "a code challenge without a channel"
                    : "a password challenge";

            throw new CustomAuthError(
                UNSUPPORTED_FLOW_TRANSITION,
                `Authentication method selection expected ${expectedChallenge}, but the server returned ${returnedChallenge}.`,
                correlationId
            );
        } catch (error) {
            logger.errorPii(
                `Failed to request V2 challenge. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthResultV2.createWithError(error, {
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }

    private async requestSelectedMethodChallenge(
        method: AuthenticationMethodV2
    ): Promise<{
        result: FlowCodeRequiredResultV2 | FlowPasswordRequiredResultV2;
        selectedMethod: AuthenticationMethodV2;
    }> {
        const { correlationId, continuationState, flowClient } =
            this.stateParameters;
        const selectedMethod = this.methods.find(
            (candidate) => candidate.id === method.id
        );

        if (!selectedMethod) {
            throw new InvalidArgumentError("method", correlationId);
        }

        const result = await flowClient.requestChallenge({
            correlationId,
            continuationState: {
                ...continuationState,
                links: {
                    ...continuationState.links,
                    challenge: selectedMethod.challengeHref,
                },
            },
        });

        return { result, selectedMethod };
    }
}
