/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    RedirectRequest,
    PopupRequest,
    SsoSilentRequest,
    AuthenticationResult,
    EndSessionRequest,
    ClearCacheRequest,
} from "@azure/msal-browser";
import { ChallengeType } from "../../CustomAuthConstants.js";
import {
    CustomAuthApiError,
    CustomAuthApiErrorCode,
} from "../../core/error/CustomAuthApiError.js";
import { CustomAuthInteractionClientBase } from "../../core/interaction_client/CustomAuthInteractionClientBase.js";
import {
    SignInChallengeRequest,
    SignInInitiateRequest,
} from "../../core/network_client/custom_auth_api/request/SignInRequest.js";
import {
    SignInContinuationTokenParams,
    SignInStartParams,
    SignInResendCodeParams,
    SignInSubmitCodeParams,
    SignInSubmitPasswordParams,
} from "./parameter/SignInParams.js";
import {
    SignInCodeSendResult,
    SignInCompleteResult,
    SignInWithContinuationTokenResult,
} from "./result/SignInActionResult.js";
import { MethodNotImplementedError } from "../../core/error/MethodNotImplementedError.js";
import { PublicApiId } from "../../core/telemetry/PublicApiId.js";

export class SigninClient extends CustomAuthInteractionClientBase {
    async start(
        parameters: SignInStartParams
    ): Promise<SignInWithContinuationTokenResult | SignInCodeSendResult> {
        const apiId = !parameters.password
            ? PublicApiId.SIGN_IN_WITH_CODE_START
            : PublicApiId.SIGN_IN_WITH_PASSWORD_START;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        const initiateRequest = SignInInitiateRequest.create(
            parameters,
            telemetryManager
        );

        // There is no need to catch the error here. If an error is thrown, it should be caught by the caller.
        const initiateResponse =
            await this.customAuthApiClient.performSignInInitiateRequest(
                initiateRequest
            );

        // Create challenge request.
        const challengeRequest = SignInChallengeRequest.create(
            parameters,
            initiateResponse.continuation_token ?? "",
            telemetryManager
        );

        // Call challenge endpoint.
        const challengeResponse =
            await this.customAuthApiClient.performSignInChallengeRequest(
                challengeRequest
            );

        if (challengeResponse.challenge_type === ChallengeType.PASSWORD) {
            // Password is required
            return new SignInWithContinuationTokenResult(
                challengeResponse.continuation_token ?? "",
                parameters.correlationId,
                challengeResponse.challenge_type
            );
        } else if (challengeResponse.challenge_type === ChallengeType.OOB) {
            // Code is required
            return new SignInCodeSendResult(
                challengeResponse.continuation_token ?? "",
                challengeResponse.challenge_type ?? "",
                challengeResponse.challenge_channel ?? "",
                challengeResponse.target_challenge_label ?? "",
                challengeResponse.code_length ?? 0,
                parameters.correlationId
            );
        }

        throw new CustomAuthApiError(
            CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
            `Unsupported challenge type '${challengeResponse.challenge_type}'.`,
            parameters.correlationId
        );
    }

    async submitCode(
        parameters: SignInSubmitCodeParams
    ): Promise<SignInCompleteResult> {
        throw new Error(`Method not implemented with Parameter ${parameters}.`);
    }

    async submitPassword(
        parameters: SignInSubmitPasswordParams
    ): Promise<SignInCompleteResult> {
        throw new Error(`Method not implemented with Parameter ${parameters}.`);
    }

    async resendCode(
        parameters: SignInResendCodeParams
    ): Promise<SignInCodeSendResult> {
        throw new Error(`Method not implemented with Parameter ${parameters}.`);
    }

    async signInWithContinuationToken(
        parameters: SignInContinuationTokenParams
    ): Promise<SignInWithContinuationTokenResult> {
        throw new Error(`Method not implemented with Parameter ${parameters}.`);
    }

    // It is not necessary to implement this method from base class.
    acquireToken(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: RedirectRequest | PopupRequest | SsoSilentRequest
    ): Promise<AuthenticationResult | void> {
        throw new MethodNotImplementedError("SignInClient.acquireToken");
    }

    // It is not necessary to implement this method from base class.
    logout(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        request: EndSessionRequest | ClearCacheRequest | undefined
    ): Promise<void> {
        throw new MethodNotImplementedError("SignInClient.logout");
    }
}
