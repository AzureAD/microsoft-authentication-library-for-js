/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthResultV2 } from "../../../../core/auth_flow/v2/CustomAuthResultV2.js";
import type { AuthFlowErrorBaseV2 } from "../../../../core/auth_flow/v2/error/AuthFlowErrorBaseV2.js";
import { ChallengeVerificationRequiredStateV2 } from "../../../../core/auth_flow/v2/state/ChallengeVerificationRequiredStateV2.js";
import { CompletedStateV2 } from "../../../../core/auth_flow/v2/state/CompletedStateV2.js";
import type { CustomAuthActionRequiredStateParametersV2 } from "../../../../core/auth_flow/v2/state/CustomAuthStateParametersV2.js";
import { MFARequiredStateV2 } from "../../../../core/auth_flow/v2/state/MFARequiredStateV2.js";
import { CustomAuthError } from "../../../../core/error/CustomAuthError.js";
import { CustomAuthAccountData } from "../../../../get_account/auth_flow/CustomAuthAccountData.js";
import {
    FLOW_CODE_REQUIRED_V2,
    FLOW_COMPLETED_V2,
    FLOW_MFA_REQUIRED_V2,
    FLOW_PASSWORD_REQUIRED_V2,
    type FlowCodeRequiredResultV2,
    type FlowCompletedResultV2,
    type FlowMFARequiredResultV2,
    type FlowPasswordRequiredResultV2,
    type FlowSignInCodeRequiredResultV2,
} from "../../../../core/interaction_client/v2/result/FlowActionResultV2.js";
import { UNSUPPORTED_FLOW_TRANSITION } from "../../../../core/network_client/custom_auth_api/v2/ErrorCodesV2.js";
import type { VerifyChallengeResultV2 } from "../../../../core/auth_flow/v2/result/VerifyChallengeResultV2.js";
import type { SignInStartResultV2 } from "../result/SignInStartResultV2.js";
import type { SubmitPasswordResultV2 } from "../result/SubmitPasswordResultV2.js";
import { PasswordRequiredStateV2 } from "./PasswordRequiredStateV2.js";
import type { SignInActionRequiredStateParametersV2 } from "./SignInStateParametersV2.js";
import { CustomAuthFlowScenarioV2 } from "../../../../core/auth_flow/v2/CustomAuthFlowScenarioV2.js";

type FlowSignInStartResultV2 =
    | FlowPasswordRequiredResultV2
    | FlowSignInCodeRequiredResultV2
    | FlowMFARequiredResultV2
    | FlowCompletedResultV2;

type FlowSignInVerificationResultV2 =
    | FlowMFARequiredResultV2
    | FlowCompletedResultV2;

type SignInStateContextV2 = Omit<
    CustomAuthActionRequiredStateParametersV2,
    "continuationState"
>;

export class SignInStateTransitionHandlerV2 {
    handleStart(
        result: FlowSignInStartResultV2,
        stateContext: SignInStateContextV2
    ): SignInStartResultV2 {
        if (result.type === FLOW_COMPLETED_V2) {
            return this.createCompletedResult(
                result,
                stateContext,
                CustomAuthFlowScenarioV2.SignIn
            );
        }

        const commonStateParameters = this.createCommonStateParameters(
            result,
            stateContext
        );

        if (result.type === FLOW_CODE_REQUIRED_V2) {
            return new CustomAuthResultV2(
                new ChallengeVerificationRequiredStateV2({
                    ...commonStateParameters,
                    method: result.method,
                    sentTo: result.sentTo,
                    channel: result.channel,
                    codeLength: result.codeLength,
                }),
                undefined,
                result.continuationState.scenario
            );
        }

        if (result.type === FLOW_PASSWORD_REQUIRED_V2) {
            return new CustomAuthResultV2(
                new PasswordRequiredStateV2(commonStateParameters),
                undefined,
                result.continuationState.scenario
            );
        }

        if (result.type === FLOW_MFA_REQUIRED_V2) {
            return new CustomAuthResultV2(
                new MFARequiredStateV2({
                    ...commonStateParameters,
                    methods: result.methods,
                }),
                undefined,
                result.continuationState.scenario
            );
        }

        return this.unsupportedTransition(result, stateContext);
    }

    handlePasswordVerification(
        result: FlowSignInVerificationResultV2,
        stateParameters: CustomAuthActionRequiredStateParametersV2
    ): SubmitPasswordResultV2 {
        return this.handleVerification(result, stateParameters);
    }

    handleCodeVerification(
        result: FlowSignInVerificationResultV2,
        stateParameters: CustomAuthActionRequiredStateParametersV2
    ): VerifyChallengeResultV2 {
        return this.handleVerification(result, stateParameters);
    }

    private handleVerification<TError extends AuthFlowErrorBaseV2>(
        result: FlowSignInVerificationResultV2,
        stateParameters: CustomAuthActionRequiredStateParametersV2
    ): CustomAuthResultV2<
        CompletedStateV2 | MFARequiredStateV2,
        TError,
        CustomAuthAccountData | undefined
    > {
        if (result.type === FLOW_COMPLETED_V2) {
            return this.createCompletedResult<TError>(
                result,
                stateParameters,
                stateParameters.continuationState.scenario
            );
        }

        if (result.type === FLOW_MFA_REQUIRED_V2) {
            return new CustomAuthResultV2(
                new MFARequiredStateV2({
                    ...this.createCommonStateParameters(
                        result,
                        stateParameters
                    ),
                    methods: result.methods,
                }),
                undefined,
                result.continuationState.scenario
            );
        }

        return this.unsupportedTransition(result, stateParameters);
    }

    private createCompletedResult<TError extends AuthFlowErrorBaseV2>(
        result: FlowCompletedResultV2,
        stateContext: SignInStateContextV2,
        scenario: CustomAuthFlowScenarioV2
    ): CustomAuthResultV2<
        CompletedStateV2,
        TError,
        CustomAuthAccountData | undefined
    > {
        const account = new CustomAuthAccountData(
            result.authenticationResult.account,
            stateContext.config,
            stateContext.cacheClient,
            stateContext.logger,
            result.correlationId
        );

        return new CustomAuthResultV2(
            new CompletedStateV2(),
            account,
            scenario
        );
    }

    private createCommonStateParameters(
        result:
            | FlowPasswordRequiredResultV2
            | FlowCodeRequiredResultV2
            | FlowMFARequiredResultV2,
        stateContext: SignInStateContextV2
    ): SignInActionRequiredStateParametersV2 {
        return {
            correlationId: result.correlationId,
            logger: stateContext.logger,
            config: stateContext.config,
            flowClient: stateContext.flowClient,
            continuationState: result.continuationState,
            cacheClient: stateContext.cacheClient,
            signInStateTransitionHandler: this,
        };
    }

    private unsupportedTransition(
        result: never,
        stateContext: SignInStateContextV2
    ): never {
        void result;
        throw new CustomAuthError(
            UNSUPPORTED_FLOW_TRANSITION,
            "The sign-in result type is not supported.",
            stateContext.correlationId
        );
    }
}
