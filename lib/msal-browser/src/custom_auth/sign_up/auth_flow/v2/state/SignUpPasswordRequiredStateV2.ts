/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { SignUpAttributeV2 } from "../../../../core/network_client/custom_auth_api/v2/result/SignUpResultsV2.js";
import type { UserAccountAttributes } from "../../../../UserAccountAttributes.js";
import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
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
        const { correlationId, logger, continuationState } =
            this.stateParameters;

        try {
            this.ensurePasswordIsNotEmpty(password);
            const result = await this.submitAttributesAction({
                ...attributes,
                password,
            });
            return this.stateParameters.signUpStateTransitionHandler.handleAttributeSubmission(
                result,
                this.stateParameters,
                "password"
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
