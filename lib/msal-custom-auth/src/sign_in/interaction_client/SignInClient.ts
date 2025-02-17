/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ChallengeType, DefaultCustomAuthApiCodeLength } from "../../CustomAuthConstants.js";
import { CustomAuthApiError } from "../../core/error/CustomAuthApiError.js";
import { CustomAuthApiErrorCode } from "../../core/network_client/custom_auth_api/types/ApiErrorResponseTypes.js";

import { CustomAuthInteractionClientBase } from "../../core/interaction_client/CustomAuthInteractionClientBase.js";
import {
    SignInStartParams,
    SignInResendCodeParams,
    SignInSubmitCodeParams,
    SignInSubmitPasswordParams,
    SignInContinuationTokenParams,
} from "./parameter/SignInParams.js";
import {
    SignInCodeSendResult,
    SignInCompletedResult,
    SignInPasswordRequiredResult,
} from "./result/SignInActionResult.js";
import { PublicApiId } from "../../core/telemetry/PublicApiId.js";
import { ArgumentValidator } from "../../core/utils/ArgumentValidator.js";
import {
    SignInChallengeRequest,
    SignInContinuationTokenRequest,
    SignInInitiateRequest,
    SignInOobTokenRequest,
    SignInPasswordTokenRequest,
} from "../../core/network_client/custom_auth_api/types/ApiRequestTypes.js";
import { SignInTokenResponse } from "../../core/network_client/custom_auth_api/types/ApiResponseTypes.js";
import { SignInScenario } from "../auth_flow/SignInScenario.js";
import { UnexpectedError } from "../../core/error/UnexpectedError.js";
import {
    AuthenticationResult,
    BrowserCacheManager,
    BrowserConfiguration,
    EventHandler,
    ICrypto,
    INavigationClient,
    IPerformanceClient,
    Logger,
    ResponseHandler,
} from "@azure/msal-browser";
import { ICustomAuthApiClient } from "../../core/network_client/custom_auth_api/ICustomAuthApiClient.js";
import { CustomAuthAuthority } from "../../core/CustomAuthAuthority.js";

export class SignInClient extends CustomAuthInteractionClientBase {
    private readonly tokenResponseHandler: ResponseHandler;

    constructor(
        config: BrowserConfiguration,
        storageImpl: BrowserCacheManager,
        browserCrypto: ICrypto,
        logger: Logger,
        eventHandler: EventHandler,
        navigationClient: INavigationClient,
        performanceClient: IPerformanceClient,
        customAuthApiClient: ICustomAuthApiClient,
        customAuthAuthority: CustomAuthAuthority,
    ) {
        super(
            config,
            storageImpl,
            browserCrypto,
            logger,
            eventHandler,
            navigationClient,
            performanceClient,
            customAuthApiClient,
            customAuthAuthority,
        );

        this.tokenResponseHandler = new ResponseHandler(
            this.config.auth.clientId,
            this.browserStorage,
            this.browserCrypto,
            this.logger,
            null,
            null,
        );
    }

    /**
     * Starts the signin flow.
     * @param parameters The parameters required to start the sign-in flow.
     * @returns The result of the sign-in start operation.
     */
    async start(parameters: SignInStartParams): Promise<SignInPasswordRequiredResult | SignInCodeSendResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);

        const apiId = !parameters.password
            ? PublicApiId.SIGN_IN_WITH_CODE_START
            : PublicApiId.SIGN_IN_WITH_PASSWORD_START;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        this.logger.info("Calling initiate endpoint for sign in.");

        const initReq: SignInInitiateRequest = {
            challenge_type: parameters.challengeType.join(" "),
            username: parameters.username,
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };

        const initiateResponse = await this.customAuthApiClient.signInApi.initiate(initReq);

        this.logger.info("Initiate endpoint called for sign in.");

        const challengeReq: SignInChallengeRequest = {
            challenge_type: this.getChallengeTypes(parameters.challengeType),
            continuation_token: initiateResponse.continuation_token ?? "",
            correlationId: initiateResponse.correlation_id,
            telemetryManager: telemetryManager,
        };

        return this.performChallengeRequest(challengeReq);
    }

    /**
     * Resends the code for sign-in flow.
     * @param parameters The parameters required to resend the code.
     * @returns The result of the sign-in resend code action.
     */
    async resendCode(parameters: SignInResendCodeParams): Promise<SignInCodeSendResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);

        const apiId = PublicApiId.SIGN_IN_RESEND_CODE;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);

        const challengeReq: SignInChallengeRequest = {
            challenge_type: parameters.challengeType.join(" "),
            continuation_token: parameters.continuationToken ?? "",
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };

        const result = await this.performChallengeRequest(challengeReq);

        if (result instanceof SignInPasswordRequiredResult) {
            this.logger.error("Resend code operation failed due to the challenge type 'password' is not supported.");

            throw new CustomAuthApiError(
                CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
                "Unsupported challenge type 'password'.",
                result.correlationId,
            );
        }

        return result;
    }

    /**
     * Submits the code for sign-in flow.
     * @param parameters The parameters required to submit the code.
     * @returns The result of the sign-in submit code action.
     */
    async submitCode(parameters: SignInSubmitCodeParams): Promise<SignInCompletedResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);
        ArgumentValidator.ensureArgumentIsNotEmptyString("parameters.code", parameters.code, parameters.correlationId);

        const apiId = PublicApiId.SIGN_IN_SUBMIT_CODE;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);
        const scopes = this.getScopes(parameters.scopes);

        const request: SignInOobTokenRequest = {
            continuation_token: parameters.continuationToken,
            oob: parameters.code,
            scope: scopes.join(" "),
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };

        return this.performTokenRequest(() => this.customAuthApiClient.signInApi.requestTokensWithOob(request), scopes);
    }

    /**
     * Submits the password for sign-in flow.
     * @param parameters The parameters required to submit the password.
     * @returns The result of the sign-in submit password action.
     */
    async submitPassword(parameters: SignInSubmitPasswordParams): Promise<SignInCompletedResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);
        ArgumentValidator.ensureArgumentIsNotEmptyString(
            "parameters.password",
            parameters.password,
            parameters.correlationId,
        );

        const apiId = PublicApiId.SIGN_IN_SUBMIT_PASSWORD;
        const telemetryManager = this.initializeServerTelemetryManager(apiId);
        const scopes = this.getScopes(parameters.scopes);

        const request: SignInPasswordTokenRequest = {
            continuation_token: parameters.continuationToken,
            password: parameters.password,
            scope: scopes.join(" "),
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
        };

        return this.performTokenRequest(
            () => this.customAuthApiClient.signInApi.requestTokensWithPassword(request),
            scopes,
        );
    }

    /**
     * Signs in with continuation token.
     * @param parameters The parameters required to sign in with continuation token.
     * @returns The result of the sign-in complete action.
     */
    async signInWithContinuationToken(parameters: SignInContinuationTokenParams): Promise<SignInCompletedResult> {
        ArgumentValidator.ensureArgumentIsNotNullOrUndefined("parameters", parameters);

        const apiId = this.getPublicApiIdBySignInScenario(parameters.signInScenario, parameters.correlationId);
        const telemetryManager = this.initializeServerTelemetryManager(apiId);
        const scopes = this.getScopes(parameters.scopes);

        // Create token request.
        const request: SignInContinuationTokenRequest = {
            continuation_token: parameters.continuationToken,
            username: parameters.username,
            correlationId: parameters.correlationId,
            telemetryManager: telemetryManager,
            scope: scopes.join(" "),
        };

        // Call token endpoint.
        return this.performTokenRequest(
            () => this.customAuthApiClient.signInApi.requestTokenWithContinuationToken(request),
            scopes,
        );
    }

    private async performTokenRequest(
        tokenEndpointCaller: () => Promise<SignInTokenResponse>,
        requestScopes: string[],
    ): Promise<SignInCompletedResult> {
        this.logger.info("Calling token endpoint for sign in.");

        const requestTimestamp = Math.round(new Date().getTime() / 1000.0);
        const tokenResponse = await tokenEndpointCaller();

        this.logger.info("Token endpoint called for sign in.");

        // Save tokens and create authentication result.
        const result = await this.tokenResponseHandler.handleServerTokenResponse(
            tokenResponse,
            this.customAuthAuthority,
            requestTimestamp,
            {
                authority: this.customAuthAuthority.canonicalAuthority,
                correlationId: tokenResponse.correlation_id ?? "",
                scopes: requestScopes,
                storeInCache: {
                    idToken: true,
                    accessToken: true,
                    refreshToken: true,
                },
            },
        );

        return new SignInCompletedResult(tokenResponse.correlation_id ?? "", result as AuthenticationResult);
    }

    private async performChallengeRequest(
        request: SignInChallengeRequest,
    ): Promise<SignInPasswordRequiredResult | SignInCodeSendResult> {
        this.logger.info("Calling challenge endpoint for sign in.");

        const challengeResponse = await this.customAuthApiClient.signInApi.requestChallenge(request);

        this.logger.info("Challenge endpoint called for sign in.");

        if (challengeResponse.challenge_type === ChallengeType.OOB) {
            // Code is required
            this.logger.info("Challenge type is oob for sign in.");

            return new SignInCodeSendResult(
                challengeResponse.correlation_id,
                challengeResponse.continuation_token ?? "",
                challengeResponse.challenge_channel ?? "",
                challengeResponse.challenge_target_label ?? "",
                challengeResponse.code_length ?? DefaultCustomAuthApiCodeLength,
                challengeResponse.binding_method ?? "",
            );
        }

        if (challengeResponse.challenge_type === ChallengeType.PASSWORD) {
            // Password is required
            this.logger.info("Challenge type is password for sign in.");

            return new SignInPasswordRequiredResult(
                challengeResponse.correlation_id,
                challengeResponse.continuation_token ?? "",
            );
        }

        this.logger.error(`Unsupported challenge type '${challengeResponse.challenge_type}' for sign in.`);

        throw new CustomAuthApiError(
            CustomAuthApiErrorCode.UNSUPPORTED_CHALLENGE_TYPE,
            `Unsupported challenge type '${challengeResponse.challenge_type}'.`,
            challengeResponse.correlation_id,
        );
    }

    private getPublicApiIdBySignInScenario(scenario: SignInScenario, correlationId: string): number {
        switch (scenario) {
            case SignInScenario.SignInAfterSignUp:
                return PublicApiId.SIGN_IN_AFTER_SIGN_UP;
            case SignInScenario.SignInAfterPasswordReset:
                return PublicApiId.SIGN_IN_AFTER_PASSWORD_RESET;
            default:
                throw new UnexpectedError(`nsupported sign-in scenario '${scenario}'.`, correlationId);
        }
    }
}
