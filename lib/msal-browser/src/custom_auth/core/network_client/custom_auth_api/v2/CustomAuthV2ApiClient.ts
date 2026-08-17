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
    RESET_PASSWORD_UNSUPPORTED,
    INVALID_HAL_RESPONSE,
    NO_AUTHENTICATION_METHODS,
    V2ResponseState,
} from "./V2ApiClientConstants.js";

/*
 * Native Auth V2 network client. Implements the HAL `/api` steps on top of the shared
 * V2BaseApiClient plumbing, following the server-provided `_links` hrefs step to step. It is
 * flow-agnostic: per-flow entry methods (`resetPasswordStart` today; `signUpStart`/`signInStart`
 * when those flows are ported) seed the flow, while the code/challenge/token steps are generic
 * href-followers reused by every flow. Per-step navigation fallbacks live here: the challenge link
 * is taken from the embedded method first and falls back to the top-level `_links`; the update
 * link falls back to `self`.
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
     * Reset-password entry (steps 1-2): run the authorize-challenge entry to obtain the seed
     * continuation token and the `reset_password` href, then POST resetpassword-start to that href
     * via the shared `startFlow` tail. The flow-specific entry for SSPR (sign-up/sign-in get their
     * own `*Start` methods that select their own href + unsupported error and reuse `startFlow`).
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
                message: "The authorize-challenge entry response did not include a reset-password link, so self-service password reset is not available for this application or tenant configuration",
            },
            request,
            context
        );
    }

    /*
     * Shared entry tail reused by every per-flow `*Start` method. The caller has already run
     * authorize-challenge and picked its own flow href; this guards that href (throwing the caller's
     * flow-specific unsupported error when absent), POSTs the start request, and returns the token to
     * carry forward plus the challenge href (from the embedded method, else the top-level `_links`).
     * Flow-agnostic by construction: the one genuinely per-flow bit (which href to POST to) is chosen
     * by the caller and passed in, so this method never switches on flow.
     */
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
            challengeContext: parsedResponse.body.challengeContext,
        };
    }

    /*
     * Step 3: POST the `challenge` href to have the OTP sent. Returns the `verify` href to submit
     * the code and, when present, the `resend` href plus the OTP display metadata.
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
     * Step 4: POST the credential (OTP) to the `verify` href. Flow-agnostic: the server drives the
     * next step, so this returns a `V2VerifyResult` discriminated on the server's next action rather
     * than a reset-specific shape. `state: continue` means the credential completed the interactive
     * part (redeem next); otherwise the HAL `action` names the next step (SSPR -> `update`).
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

    /*
     * Map a verify response onto the flow-agnostic `V2VerifyResult`, mirroring the server's own
     * precedence: a `state: continue` response carries no `action` and means "nothing more to do
     * interactively" (redeem via authorize-challenge -> token); otherwise the HAL `action` names
     * the next interactive step. Today verify only yields `update` (SSPR) or `continue` (sign-in);
     * anything else is an unexpected/unsupported verify outcome.
     */
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
     * Step 5: PUT the new password to the `update` href. Returns the `poll` href to check for
     * completion.
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
     * Step 6 (single poll): POST the `poll` href once. When the reset has been applied the server
     * returns `state: continue` with the `continue` href (the authorize-challenge resume endpoint);
     * until then the caller re-polls. The retry loop is owned by the controller layer.
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
     * Steps 7-8: redeem the continuation token for an authorization code, then exchange the code
     * for tokens. Called once polling reports completion, to finish the reset by signing the user
     * in.
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

    /*
     * Resolve the selectable authentication methods from a flow-start response. Each embedded
     * method under `_embedded.methods[]` that advertises a `challenge` link becomes a selectable
     * method (its id/type/hint are display metadata; an id is synthesized from the type or position
     * when the server omits one). The start response must advertise at least one embedded method
     * with a challenge link - the challenge link lives only under `_embedded.methods[]._links`, never
     * at the top level - so a response with no such method is malformed and raises an api error.
     */
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
