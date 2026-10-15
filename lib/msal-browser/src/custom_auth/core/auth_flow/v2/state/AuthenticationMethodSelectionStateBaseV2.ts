/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import { InvalidArgumentError } from "../../../error/InvalidArgumentError.js";
import { AuthenticationMethodV2 } from "../AuthenticationMethodV2.js";
import type { CustomAuthActionRequiredStateParametersV2 } from "./CustomAuthStateParametersV2.js";
import type {
    FlowCodeRequiredResultV2,
    FlowPasswordRequiredResultV2,
} from "../../../interaction_client/v2/result/FlowActionResultV2.js";

interface AuthenticationMethodSelectionStateParametersV2
    extends CustomAuthActionRequiredStateParametersV2 {
    methods: readonly AuthenticationMethodV2[];
}

export abstract class AuthenticationMethodSelectionStateBaseV2<
    TParameters extends AuthenticationMethodSelectionStateParametersV2
> extends AuthFlowActionRequiredStateBase<TParameters> {
    readonly methods: readonly AuthenticationMethodV2[];

    constructor(stateParameters: TParameters) {
        super(stateParameters);
        this.methods = stateParameters.methods;
    }

    protected async requestSelectedMethodChallenge(
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
