/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Logger } from "@azure/msal-common/browser";
import { IHttpClient, HttpMethod } from "../../http_client/IHttpClient.js";
import { CustomAuthRequestInterceptor } from "../../../../configuration/CustomAuthRequestInterceptor.js";
import { V2BaseApiClient } from "./V2BaseApiClient.js";
import {
    ResetPasswordUpdateResult,
    ResetPasswordPollResult,
} from "./result/ResetPasswordV2Results.js";
import {
    V2StartResult,
    V2StartMethod,
    V2ChallengeResult,
    V2VerifyResult,
} from "./result/V2BaseResults.js";
import { CustomAuthV2ApiError } from "./error/CustomAuthV2ApiError.js";
import { V2SerializedResponse } from "./response/V2SerializedResponse.js";
import {
    ResetPasswordStartV2Response,
    ChallengeV2Response,
    VerifyV2Response,
    UpdatePasswordV2Response,
    PollV2Response,
    V2TokenResponse,
} from "./response/V2Responses.js";
import {
    V2RequestContext,
    V2HalRequestBase,
    ResetPasswordStartV2Request,
    ChallengeV2Request,
    VerifyV2Request,
    UpdatePasswordV2Request,
    PollV2Request,
} from "./request/V2Requests.js";
import {
    CHALLENGE_RELATION,
    RESEND_RELATION,
    VERIFY_RELATION,
    UPDATE_RELATION,
    POLL_RELATION,
    CONTINUE_RELATION,
    V2ResponseState,
} from "./V2ApiClientConstants.js";
import {
    INVALID_HAL_RESPONSE,
    NO_AUTHENTICATION_METHODS,
    RESET_PASSWORD_UNSUPPORTED,
} from "./error/V2ErrorCodes.js";

/*
 * Native Auth V2 network client that follows server-provided HAL links.
 * Flow-specific entry methods reuse shared challenge, verification, and token operations.
 */
export class CustomAuthV2ApiClient extends V2BaseApiClient {
    constructor(
        baseUrl: string,
        clientId: string,
        httpClient: IHttpClient,
        customAuthApiQueryParams?: Record<string, string>,
        requestInterceptor?: CustomAuthRequestInterceptor,
        logger?: Logger
    ) {
        super(
            baseUrl,
            clientId,
            httpClient,
            customAuthApiQueryParams,
            requestInterceptor,
            logger
        );
    }

    /*
     * Starts the reset-password flow using the link returned by authorize-challenge.
     */
    async resetPasswordStart(
        username: string,
        context: V2RequestContext
    ): Promise<V2StartResult> {
        const entryResult = await this.authorizeChallengeStart(context);

        const request: ResetPasswordStartV2Request = {
            username,
            continuationToken: entryResult.continuationToken,
        };

        return this.startFlow<ResetPasswordStartV2Request>(
            entryResult.resetPasswordHref,
            {
                code: RESET_PASSWORD_UNSUPPORTED,
                message:
                    "The authorize-challenge entry response did not include a reset-password link, so self-service password reset is not available for this application or tenant configuration",
            },
            request,
            context
        );
    }

    private async startFlow<TRequest extends V2HalRequestBase>(
        startHref: string | undefined,
        unsupported: { code: string; message: string },
        request: TRequest,
        context: V2RequestContext
    ): Promise<V2StartResult> {
        if (!startHref) {
            this.logger?.error(unsupported.message, context.correlationId);

            throw new CustomAuthV2ApiError(
                unsupported.code,
                unsupported.message,
                { correlationId: context.correlationId }
            );
        }

        const parsedResponse =
            await this.sendHalRequest<ResetPasswordStartV2Response>(
                startHref,
                HttpMethod.POST,
                request,
                context
            );

        const continuationToken = this.handler.requireContinuationToken(
            parsedResponse.continuationToken,
            parsedResponse.correlationId
        );

        return {
            continuationToken,
            methods: this.resolveMethods(
                parsedResponse.body,
                parsedResponse.correlationId
            ),
            scenario: parsedResponse.body.scenario,
        };
    }

    /*
     * Requests an OTP and returns the links and metadata needed for verification.
     */
    async requestChallenge(
        challengeHref: string,
        request: ChallengeV2Request,
        context: V2RequestContext
    ): Promise<V2ChallengeResult> {
        const parsedResponse = await this.sendHalRequest<ChallengeV2Response>(
            challengeHref,
            HttpMethod.POST,
            request,
            context
        );

        const nextContinuationToken = this.handler.requireContinuationToken(
            parsedResponse.continuationToken,
            parsedResponse.correlationId
        );

        return {
            continuationToken: nextContinuationToken,
            verifyHref: this.handler.requireRelationHref(
                parsedResponse.body._links,
                VERIFY_RELATION,
                parsedResponse.correlationId
            ),
            resendHref: this.handler.getRelationHref(
                parsedResponse.body._links,
                RESEND_RELATION
            ),
            codeLength:
                parsedResponse.body.codeLength ??
                parsedResponse.body.payload?.codeLength,
            hint: parsedResponse.body.hint,
            channel: parsedResponse.body.type,
        };
    }

    /*
     * Verifies the OTP and returns the server-directed next action.
     */
    async verifyCode(
        verifyHref: string,
        request: VerifyV2Request,
        context: V2RequestContext
    ): Promise<V2VerifyResult> {
        const parsedResponse = await this.sendHalRequest<VerifyV2Response>(
            verifyHref,
            HttpMethod.POST,
            request,
            context
        );

        return this.toVerifyResult(parsedResponse);
    }

    private toVerifyResult(
        parsedResponse: V2SerializedResponse<VerifyV2Response>
    ): V2VerifyResult {
        const correlationId = parsedResponse.correlationId;
        const continuationToken = this.handler.requireContinuationToken(
            parsedResponse.continuationToken,
            correlationId
        );

        if (parsedResponse.body.state === V2ResponseState.CONTINUE) {
            return {
                nextAction: "continue",
                continuationToken,
            };
        }

        if (parsedResponse.body.action === UPDATE_RELATION) {
            return {
                nextAction: "update",
                continuationToken,
                updateHref: this.handler.requireRelationHref(
                    parsedResponse.body._links,
                    UPDATE_RELATION,
                    correlationId
                ),
            };
        }

        throw new CustomAuthV2ApiError(
            INVALID_HAL_RESPONSE,
            "Invalid HAL response: verify returned no known next action",
            { correlationId }
        );
    }

    /*
     * Submits the new password and returns the link used to poll for completion.
     */
    async submitNewPassword(
        updateHref: string,
        request: UpdatePasswordV2Request,
        context: V2RequestContext
    ): Promise<ResetPasswordUpdateResult> {
        const parsedResponse =
            await this.sendHalRequest<UpdatePasswordV2Response>(
                updateHref,
                HttpMethod.PUT,
                request,
                context
            );

        const nextContinuationToken = this.handler.requireContinuationToken(
            parsedResponse.continuationToken,
            parsedResponse.correlationId
        );

        return {
            continuationToken: nextContinuationToken,
            pollHref: this.handler.requireRelationHref(
                parsedResponse.body._links,
                POLL_RELATION,
                parsedResponse.correlationId
            ),
        };
    }

    /*
     * Polls once for reset completion and returns the next server-provided link.
     */
    async poll(
        pollHref: string,
        request: PollV2Request,
        context: V2RequestContext
    ): Promise<ResetPasswordPollResult> {
        const parsedResponse = await this.sendHalRequest<PollV2Response>(
            pollHref,
            HttpMethod.POST,
            request,
            context
        );

        const isCompleted =
            parsedResponse.body.state === V2ResponseState.CONTINUE;

        return {
            continuationToken:
                parsedResponse.continuationToken ?? request.continuationToken,
            isCompleted,
            continueHref: isCompleted
                ? this.handler.getRelationHref(
                      parsedResponse.body._links,
                      CONTINUE_RELATION
                  )
                : undefined,
            pollHref: isCompleted
                ? undefined
                : this.handler.requireRelationHref(
                      parsedResponse.body._links,
                      POLL_RELATION,
                      parsedResponse.correlationId
                  ),
        };
    }

    /*
     * Redeems the continuation token for an authorization code and then tokens.
     */
    async completeWithTokens(
        continuationToken: string,
        scopes: string[],
        context: V2RequestContext,
        claims?: string
    ): Promise<V2TokenResponse> {
        const code = await this.authorizeChallengeContinue(
            continuationToken,
            context
        );

        return this.token(code, scopes, context, claims);
    }

    private resolveMethods(
        body: ResetPasswordStartV2Response,
        correlationId: string
    ): V2StartMethod[] {
        const methods = this.handler.requireMethods(body, correlationId);
        const resolved: V2StartMethod[] = [];

        methods.forEach((method, index) => {
            const href = this.handler.getRelationHref(
                method._links,
                CHALLENGE_RELATION
            );

            if (href) {
                resolved.push({
                    id: method.id ?? method.type ?? `method-${index}`,
                    type: method.type,
                    hint: method.hint,
                    challengeHref: href,
                });
            }
        });

        if (resolved.length === 0) {
            this.logger?.error(
                "V2 start response has no authentication method advertising a challenge link",
                correlationId
            );

            throw new CustomAuthV2ApiError(
                NO_AUTHENTICATION_METHODS,
                "The flow-start response contains no authentication method with a challenge link",
                { correlationId }
            );
        }

        return resolved;
    }
}
