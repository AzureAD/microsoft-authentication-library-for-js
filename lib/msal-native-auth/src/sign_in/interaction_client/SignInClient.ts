/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ChallengeType } from "../../NativeAuthConstants.js";
import {
    RedirectError,
    UnknownApiError,
} from "../../core/error/NativeAuthApiError.js";
import { InteractionClientBase } from "../../core/interaction_client/InteractionClientBase.js";
import { INativeAuthApiClient } from "../../core/network_client/INativeAuthApiClient.js";
import {
    SignInChallengeRequest,
    SignInInitiateRequest,
} from "../../core/network_client/request/SignInRequest.js";
import {
    SignInCodeSendResponse,
    SignInContinuationTokenResponse,
} from "../../core/network_client/response/SignInResponse.js";
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

export class SigninClient extends InteractionClientBase {
    constructor(nativeAuthApiClient: INativeAuthApiClient) {
        super(nativeAuthApiClient);
    }

    async start(
        parameters: SignInStartParams
    ): Promise<SignInWithContinuationTokenResult | SignInCodeSendResult> {
        /*
         * Using the nativeAuthApiClient to make the requests to start the signin flow.
         * Based on the response, we will return the appropriate result for the different.
         * The followings are just some sample codes to demonstrate how to use the nativeAuthApiClient.
         */

        const initiateRequest = SignInInitiateRequest.create(parameters);

        // There is no need to catch the error here. If an error is thrown, it should be caught by the caller.
        const initiateResponse =
            await this.nativeAuthApiClient.performSignInInitiateRequest(
                initiateRequest
            );

        if (initiateResponse.challengeType === ChallengeType.REDIRECT) {
            throw new RedirectError(parameters.correlationId);
        }

        const continuationToken: string =
            initiateResponse.continuationToken || "";

        if (!continuationToken) {
            throw new UnknownApiError(
                "Unknown",
                "Cannot find continuation token in the response.",
                parameters.correlationId,
                []
            );
        }

        // Create challenge request.
        const challengeRequest = SignInChallengeRequest.create(
            parameters,
            continuationToken
        );

        // Call challenge endpoint.
        const challengeResponse =
            await this.nativeAuthApiClient.performSignInChallengeRequest(
                challengeRequest
            );

        if (initiateResponse.challengeType === ChallengeType.REDIRECT) {
            throw new RedirectError(parameters.correlationId);
        }

        if (
            challengeResponse instanceof SignInContinuationTokenResponse &&
            challengeResponse.challengeType === ChallengeType.PASSWORD
        ) {
            // Password is required
            return new SignInWithContinuationTokenResult(
                challengeResponse.continuationToken ?? "",
                parameters.correlationId,
                challengeResponse.challengeType
            );
        } else if (
            challengeResponse instanceof SignInCodeSendResponse &&
            challengeResponse.challengeType === ChallengeType.OOB
        ) {
            /*
             * Code is required
             * Need to verify the response and return the correct result.
             */
            return new SignInCodeSendResult(
                challengeResponse.continuationToken ?? "",
                challengeResponse.challengeType ?? "",
                challengeResponse.challengeChannel ?? "",
                challengeResponse.challengeTargetLabel ?? "",
                challengeResponse.codeLength ?? 0,
                parameters.correlationId
            );
        } else {
            throw new UnknownApiError(
                "Unknown",
                "Unexpected response returned from challenge endpoint.",
                parameters.correlationId,
                []
            );
        }
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
}
