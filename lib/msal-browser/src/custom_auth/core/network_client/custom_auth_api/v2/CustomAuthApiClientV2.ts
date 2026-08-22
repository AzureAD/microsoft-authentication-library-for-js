/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { HttpMethod } from "../../http_client/IHttpClient.js";
import { BaseApiClientV2 } from "./BaseApiClientV2.js";
import {
    ResetPasswordUpdateResultV2,
    ResetPasswordPollResultV2,
} from "./result/ResetPasswordResultsV2.js";
import {
    ResetPasswordStartApiResultV2,
    SignInStartApiResultV2,
    StartResultV2,
    StartMethodV2,
    ChallengeResultV2,
    VerifyResultV2,
} from "./result/BaseResultsV2.js";
import {
    PasswordResetStartResponseV2,
    SignInStartResponseV2,
    ChallengeResponseV2,
    VerifyResponseV2,
    UpdatePasswordResponseV2,
    PollResponseV2,
    ParsedResponseV2,
} from "./response/ResponsesV2.js";
import {
    RequestContextV2,
    PasswordResetStartRequestV2,
    SignInStartRequestV2,
    ChallengeRequestV2,
    VerifyRequestV2,
    UpdatePasswordRequestV2,
    PollRequestV2,
} from "./request/RequestsV2.js";
import { UPDATE_RELATION, ResponseStateV2 } from "./ApiClientConstantsV2.js";
import {
    INVALID_HAL_RESPONSE,
    NO_AUTHENTICATION_METHODS,
} from "./ErrorCodesV2.js";
import { CustomAuthError } from "../../../error/CustomAuthError.js";

/*
 * Native Auth V2 network client that follows server-provided HAL links.
 * Flow-specific entry methods reuse shared challenge, verification, and token operations.
 */
export class CustomAuthApiClientV2 extends BaseApiClientV2 {
    /*
     * Starts the reset-password flow using a server-provided link.
     */
    async resetPasswordStart(
        resetPasswordHref: string,
        request: PasswordResetStartRequestV2,
        context: RequestContextV2
    ): Promise<ResetPasswordStartApiResultV2> {
        return this.sendStartRequest(resetPasswordHref, request, context);
    }

    /*
     * Starts sign-in using a server-provided link.
     */
    async signInStart(
        signInHref: string,
        request: SignInStartRequestV2,
        context: RequestContextV2
    ): Promise<SignInStartApiResultV2> {
        return this.sendStartRequest(signInHref, request, context);
    }

    private async sendStartRequest(
        startHref: string,
        request: PasswordResetStartRequestV2 | SignInStartRequestV2,
        context: RequestContextV2
    ): Promise<StartResultV2> {
        const parsedResponse =
            await this.sendActionRequest<
                PasswordResetStartResponseV2 | SignInStartResponseV2
            >(startHref, HttpMethod.POST, request, context);

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
            authenticationFactor: this.handler.requireAuthenticationFactor(
                parsedResponse.body.challengeContext?.authenticationFactor,
                parsedResponse.correlationId
            ),
        };
    }

    /*
     * Requests an OTP and returns the links and metadata needed for verification.
     */
    async requestChallenge(
        challengeHref: string,
        request: ChallengeRequestV2,
        context: RequestContextV2
    ): Promise<ChallengeResultV2> {
        const parsedResponse =
            await this.sendActionRequest<ChallengeResponseV2>(
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
            verifyHref: this.handler.requireHref(
                parsedResponse.body._links?.verify?.href,
                "verify",
                parsedResponse.correlationId
            ),
            resendHref: parsedResponse.body._links?.resend?.href,
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
    async verifyChallenge(
        verifyHref: string,
        request: VerifyRequestV2,
        context: RequestContextV2
    ): Promise<VerifyResultV2> {
        const parsedResponse = await this.sendActionRequest<VerifyResponseV2>(
            verifyHref,
            HttpMethod.POST,
            request,
            context
        );

        return this.toVerifyResult(parsedResponse);
    }

    private toVerifyResult(
        parsedResponse: ParsedResponseV2<VerifyResponseV2>
    ): VerifyResultV2 {
        const correlationId = parsedResponse.correlationId;
        const continuationToken = this.handler.requireContinuationToken(
            parsedResponse.continuationToken,
            correlationId
        );

        if (parsedResponse.body.state === ResponseStateV2.CONTINUE) {
            return {
                nextAction: "continue",
                continuationToken,
            };
        }

        if (parsedResponse.body.action === UPDATE_RELATION) {
            return {
                nextAction: "update",
                continuationToken,
                updateHref: this.handler.requireHref(
                    parsedResponse.body._links?.update?.href,
                    "update",
                    correlationId
                ),
            };
        }

        throw new CustomAuthError(
            INVALID_HAL_RESPONSE,
            "Invalid HAL response: verify returned no known next action",
            correlationId
        );
    }

    /*
     * Submits the new password and returns the link used to poll for completion.
     */
    async submitNewPassword(
        updateHref: string,
        request: UpdatePasswordRequestV2,
        context: RequestContextV2
    ): Promise<ResetPasswordUpdateResultV2> {
        const parsedResponse =
            await this.sendActionRequest<UpdatePasswordResponseV2>(
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
            pollHref: this.handler.requireHref(
                parsedResponse.body._links?.poll?.href,
                "poll",
                parsedResponse.correlationId
            ),
        };
    }

    /*
     * Polls once for reset completion and returns the next server-provided link.
     */
    async poll(
        pollHref: string,
        request: PollRequestV2,
        context: RequestContextV2
    ): Promise<ResetPasswordPollResultV2> {
        const parsedResponse = await this.sendActionRequest<PollResponseV2>(
            pollHref,
            HttpMethod.POST,
            request,
            context
        );

        const isCompleted =
            parsedResponse.body.state === ResponseStateV2.CONTINUE;

        return {
            continuationToken:
                parsedResponse.continuationToken ?? request.continuationToken,
            isCompleted,
            continueHref: isCompleted
                ? parsedResponse.body._links?.continue?.href
                : undefined,
            pollHref: isCompleted
                ? undefined
                : this.handler.requireHref(
                      parsedResponse.body._links?.poll?.href,
                      "poll",
                      parsedResponse.correlationId
                  ),
        };
    }

    private resolveMethods(
        body: PasswordResetStartResponseV2 | SignInStartResponseV2,
        correlationId: string
    ): StartMethodV2[] {
        const methods = this.handler.requireMethods(
            body._embedded?.methods,
            correlationId
        );
        const resolved: StartMethodV2[] = [];

        methods.forEach((method, index) => {
            const href = method._links?.challenge?.href;

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

            throw new CustomAuthError(
                NO_AUTHENTICATION_METHODS,
                "The flow-start response contains no authentication method with a challenge link",
                correlationId
            );
        }

        return resolved;
    }
}
