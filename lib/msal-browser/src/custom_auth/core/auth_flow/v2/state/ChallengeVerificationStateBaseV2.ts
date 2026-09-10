/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import type { AuthenticationMethodV2 } from "../AuthenticationMethodV2.js";
import type { CodeVerificationStateParametersV2 } from "./CustomAuthStateParametersV2.js";
import type {
    FlowCodeRequiredResultV2,
    FlowSubmitCodeResultV2,
} from "../../../interaction_client/v2/result/FlowActionResultV2.js";

export abstract class ChallengeVerificationStateBaseV2<
    TParameters extends CodeVerificationStateParametersV2 = CodeVerificationStateParametersV2
> extends AuthFlowActionRequiredStateBase<TParameters> {
    readonly method?: AuthenticationMethodV2;

    readonly sentTo?: string;

    readonly channel?: string;

    readonly codeLength?: number;

    constructor(stateParameters: TParameters) {
        super(stateParameters);
        this.method = stateParameters.method;
        this.sentTo = stateParameters.sentTo;
        this.channel = stateParameters.channel;
        this.codeLength = stateParameters.codeLength;
    }

    protected async submitCodeCore(
        code: string
    ): Promise<FlowSubmitCodeResultV2> {
        if (this.codeLength) {
            this.ensureCodeIsValid(code, this.codeLength);
        }

        return this.stateParameters.flowClient.submitCode({
            correlationId: this.stateParameters.correlationId,
            continuationState: this.stateParameters.continuationState,
            code,
        });
    }

    protected async resendCodeCore(): Promise<FlowCodeRequiredResultV2> {
        return this.stateParameters.flowClient.resendCode({
            correlationId: this.stateParameters.correlationId,
            continuationState: this.stateParameters.continuationState,
        });
    }
}
