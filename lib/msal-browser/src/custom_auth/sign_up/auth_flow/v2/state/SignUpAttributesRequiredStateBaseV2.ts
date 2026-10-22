/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../../../core/auth_flow/AuthFlowState.js";
import type { FlowSignUpActionResultV2 } from "../../../../core/interaction_client/v2/result/FlowActionResultV2.js";
import type { SignUpAttributeV2 } from "../../../../core/network_client/custom_auth_api/v2/result/SignUpResultsV2.js";
import type { UserAccountAttributes } from "../../../../UserAccountAttributes.js";
import type { AttributesRequiredStateParametersV2 } from "./SignUpStateParametersV2.js";

export abstract class SignUpAttributesRequiredStateBaseV2<
    TParameters extends AttributesRequiredStateParametersV2
> extends AuthFlowActionRequiredStateBase<TParameters> {
    readonly attributes: readonly SignUpAttributeV2[];

    constructor(stateParameters: TParameters) {
        super(stateParameters);
        this.attributes = stateParameters.attributes;
    }

    protected async submitAttributesAction(
        attributes: UserAccountAttributes
    ): Promise<FlowSignUpActionResultV2> {
        const { correlationId, continuationState, flowClient } =
            this.stateParameters;

        return flowClient.submitSignUpAttributes({
            correlationId,
            continuationState,
            attributes,
        });
    }
}
