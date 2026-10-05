/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { UserAccountAttributes } from "../../../../UserAccountAttributes.js";
import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import { SubmitAttributesErrorV2 } from "../error_type/SubmitAttributesErrorV2.js";
import type { SubmitAttributesResultV2 } from "../result/SubmitAttributesResultV2.js";
import { SignUpAttributesRequiredStateBaseV2 } from "./SignUpAttributesRequiredStateBaseV2.js";
import type { AttributesRequiredStateParametersV2 } from "./SignUpStateParametersV2.js";

/**
 * State returned when sign-up requires profile or custom attributes.
 */
export class AttributesRequiredStateV2 extends SignUpAttributesRequiredStateBaseV2<AttributesRequiredStateParametersV2> {
    readonly stateType = "attributesRequired";

    /**
     * Submits the attributes requested by the latest server response.
     */
    async submitAttributes(
        attributes: UserAccountAttributes
    ): Promise<SubmitAttributesResultV2> {
        const { correlationId, logger, continuationState } =
            this.stateParameters;

        try {
            const result = await this.submitAttributesAction(attributes);
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
                errorType: SubmitAttributesErrorV2,
                scenario: continuationState.scenario,
                correlationId,
            });
        }
    }
}
