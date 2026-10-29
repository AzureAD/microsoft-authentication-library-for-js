/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { UserAccountAttributes } from "../../../../UserAccountAttributes.js";
import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { SubmitAttributesResultV2 } from "../result/SubmitAttributesResultV2.js";
import { AuthFlowActionRequiredStateBase } from "../../../../core/auth_flow/AuthFlowState.js";
import type { SignUpAttributeV2 } from "../../../../core/network_client/custom_auth_api/v2/result/SignUpResultsV2.js";
import type { AttributesRequiredStateParametersV2 } from "./SignUpStateParametersV2.js";

/**
 * State returned when sign-up requires profile or custom attributes.
 * It exposes the attribute metadata requested by the latest server response.
 */
export class AttributesRequiredStateV2 extends AuthFlowActionRequiredStateBase<AttributesRequiredStateParametersV2> {
    readonly stateType = "attributesRequired";

    readonly attributes: readonly SignUpAttributeV2[];

    constructor(stateParameters: AttributesRequiredStateParametersV2) {
        super(stateParameters);
        this.attributes = stateParameters.attributes;
    }

    /**
     * Submits the attributes requested by the latest server response.
     * The returned result identifies the next step or a submission failure.
     */
    async submitAttributes(
        attributes: UserAccountAttributes
    ): Promise<SubmitAttributesResultV2> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            const result = await flowClient.submitSignUpAttributes({
                correlationId,
                continuationState,
                attributes,
            });
            return this.stateParameters.signUpStateTransitionHandler.handleAttributeSubmission(
                result,
                this.stateParameters,
                "attribute"
            );
        } catch (error) {
            logger.errorPii(
                `Failed to submit V2 sign-up attributes. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthResultV2.createWithError(error, {
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
