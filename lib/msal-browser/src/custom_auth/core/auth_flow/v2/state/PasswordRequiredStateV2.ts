/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import type { PasswordRequiredStateParametersV2 } from "./CustomAuthStateParametersV2.js";
import { CustomAuthResultV2 } from "../CustomAuthResultV2.js";
import { CompletedStateV2 } from "./CompletedStateV2.js";
import { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import type { SubmitPasswordResultV2 } from "../result/SubmitPasswordResultV2.js";
import { AuthMethodSelectionRequiredStateV2 } from "./AuthMethodSelectionRequiredStateV2.js";
import {
    FLOW_COMPLETED_V2,
    FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2,
    FLOW_MFA_REQUIRED_V2,
} from "../../../interaction_client/v2/result/FlowActionResultV2.js";
import { CustomAuthError } from "../../../error/CustomAuthError.js";
import { UnexpectedError } from "../../../error/UnexpectedError.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { AuthenticationFactorV2 } from "../../../network_client/custom_auth_api/v2/result/BaseResultsV2.js";
import { AuthMethodRegistrationRequiredStateV2 } from "./AuthMethodRegistrationRequiredStateV2.js";
import { CustomAuthFlowScenarioV2 } from "../CustomAuthFlowScenarioV2.js";
import type { SignUpAttributeV2 } from "../../../network_client/custom_auth_api/v2/result/SignUpResultsV2.js";
import type { UserAccountAttributes } from "../../../../UserAccountAttributes.js";
import type { SubmitAttributesResultV2 } from "../../../../sign_up/auth_flow/v2/result/SubmitAttributesResultV2.js";

/**
 * State returned when sign-in or sign-up requires a password. Submit the
 * password to advance the active flow.
 */
export class PasswordRequiredStateV2 extends AuthFlowActionRequiredStateBase<PasswordRequiredStateParametersV2> {
    readonly stateType = "passwordRequired";

    readonly attributes: readonly SignUpAttributeV2[];

    readonly requiredPasswordAttribute?: SignUpAttributeV2;

    constructor(stateParameters: PasswordRequiredStateParametersV2) {
        super(stateParameters);
        this.attributes = stateParameters.attributes ?? [];
        this.requiredPasswordAttribute =
            stateParameters.requiredPasswordAttribute;
    }

    /**
     * Submits the password and advances the active flow. Sign-up also accepts
     * profile attributes requested alongside the password.
     * @param password - The account password.
     * @param attributes - Additional profile attributes to submit during sign-up.
     * @returns The next state or a password submission error.
     */
    async submitPassword(
        password: string,
        attributes: UserAccountAttributes = {}
    ): Promise<SubmitPasswordResultV2> {
        const { correlationId, logger, continuationState } =
            this.stateParameters;

        try {
            this.ensurePasswordIsNotEmpty(password);

            if (
                continuationState.scenario === CustomAuthFlowScenarioV2.SignUp
            ) {
                return await this.submitSignUpPassword(password, attributes);
            }

            if (
                continuationState.scenario === CustomAuthFlowScenarioV2.SignIn
            ) {
                return await this.submitSignInPassword(password);
            }

            throw new CustomAuthError(
                UNSUPPORTED_FLOW_TRANSITION,
                `Password submission is not supported for the '${continuationState.scenario}' flow.`,
                correlationId
            );
        } catch (error) {
            logger.errorPii(
                `Failed to submit V2 password. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthResultV2.createWithError(error, {
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }

    private async submitSignUpPassword(
        password: string,
        attributes: UserAccountAttributes
    ): Promise<SubmitAttributesResultV2> {
        const { correlationId, continuationState, flowClient } =
            this.stateParameters;
        const signUpStateTransitionHandler =
            this.stateParameters.signUpStateTransitionHandler;

        if (!signUpStateTransitionHandler) {
            throw new UnexpectedError(
                "Sign-up state transition handler is missing.",
                correlationId
            );
        }

        const result = await flowClient.submitSignUpAttributes({
            correlationId,
            continuationState,
            attributes: { ...attributes, password },
        });
        return signUpStateTransitionHandler.handleAttributeSubmission(
            result,
            { ...this.stateParameters, signUpStateTransitionHandler },
            "password"
        );
    }

    private async submitSignInPassword(
        password: string
    ): Promise<SubmitPasswordResultV2> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;
        const result = await flowClient.submitSignInPassword({
            correlationId,
            continuationState,
            password,
        });
        const resultType: string = result.type;

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

        if (result.type === FLOW_AUTH_METHOD_REGISTRATION_REQUIRED_V2) {
            return new CustomAuthResultV2(
                new AuthMethodRegistrationRequiredStateV2({
                    correlationId: result.correlationId,
                    logger,
                    config: this.stateParameters.config,
                    flowClient,
                    continuationState: result.continuationState,
                    cacheClient: this.stateParameters.cacheClient,
                    methods: result.methods,
                }),
                undefined,
                result.continuationState.scenario
            );
        }

        if (result.type === FLOW_MFA_REQUIRED_V2) {
            return new CustomAuthResultV2(
                new AuthMethodSelectionRequiredStateV2({
                    correlationId: result.correlationId,
                    logger,
                    config: this.stateParameters.config,
                    flowClient,
                    continuationState: result.continuationState,
                    cacheClient: this.stateParameters.cacheClient,
                    methods: result.methods,
                    authenticationFactor: AuthenticationFactorV2.MULTI_FACTOR,
                }),
                undefined,
                result.continuationState.scenario
            );
        }

        throw new CustomAuthError(
            UNSUPPORTED_FLOW_TRANSITION,
            `Password verification result type '${resultType}' is not supported.`,
            correlationId
        );
    }
}
