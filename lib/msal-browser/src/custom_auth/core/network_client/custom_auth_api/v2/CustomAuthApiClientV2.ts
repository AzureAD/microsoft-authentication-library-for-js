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
    VerifyNextActionV2,
    AuthenticationFactorV2,
} from "./result/BaseResultsV2.js";
import { SignUpStartApiResultV2 } from "./result/SignUpResultsV2.js";
import {
    PasswordResetStartResponseV2,
    SignInStartResponseV2,
    SignUpStartResponseV2,
    SignUpSubmitAttributesResponseV2,
    ChallengeResponseV2,
    VerifyResponseV2,
    UpdatePasswordResponseV2,
    PollResponseV2,
    ParsedResponseV2,
    EmbeddedMethodV2,
} from "./response/ResponsesV2.js";
import {
    RequestContextV2,
    PasswordResetStartRequestV2,
    SignInStartRequestV2,
    SignUpStartRequestV2,
    SignUpSubmitAttributesRequestV2,
    ChallengeRequestV2,
    VerifyRequestV2,
    UpdatePasswordRequestV2,
    PollRequestV2,
} from "./request/RequestsV2.js";
import {
    CHALLENGE_RELATION,
    UPDATE_RELATION,
    VERIFY_RELATION,
    ResponseStateV2,
} from "./ApiClientConstantsV2.js";
import {
    INVALID_HAL_RESPONSE,
    NO_AUTHENTICATION_METHODS,
    UNEXPECTED_AUTHENTICATION_FACTOR,
} from "./ErrorCodesV2.js";
import { CustomAuthApiError } from "../../../error/CustomAuthApiError.js";

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
        const result = await this.sendStartRequest(
            signInHref,
            request,
            context
        );

        return result;
    }

    /*
     * Starts sign-up using a server-provided link.
     */
    async signUpStart(
        signUpHref: string,
        request: SignUpStartRequestV2,
        context: RequestContextV2
    ): Promise<SignUpStartApiResultV2> {
        const parsedResponse =
            await this.sendActionRequest<SignUpStartResponseV2>(
                signUpHref,
                HttpMethod.POST,
                request,
                context
            );

        return {
            continuationToken: this.handler.requireContinuationToken(
                parsedResponse.continuationToken,
                parsedResponse.correlationId
            ),
            submitAttributesHref: this.handler.requireHref(
                parsedResponse.body._links?.submitAttributes?.href,
                "submitAttributes",
                parsedResponse.correlationId
            ),
            attributes: parsedResponse.body.attributes,
        };
    }

    /*
     * Submits the initial sign-up attributes. A successful response has already
     * sent the email code and supplies the links needed to verify or resend it.
     */
    async submitSignUpAttributes(
        submitAttributesHref: string,
        request: SignUpSubmitAttributesRequestV2,
        context: RequestContextV2
    ): Promise<ChallengeResultV2> {
        const parsedResponse =
            await this.sendActionRequest<SignUpSubmitAttributesResponseV2>(
                submitAttributesHref,
                HttpMethod.POST,
                request,
                context
            );

        if (parsedResponse.body.action !== VERIFY_RELATION) {
            const message =
                "Invalid HAL response: sign-up attribute submission did not return the verify action";
            this.logger?.error(message, parsedResponse.correlationId);

            throw new CustomAuthError(
                INVALID_HAL_RESPONSE,
                message,
                parsedResponse.correlationId
            );
        }

        return this.toChallengeResult(parsedResponse);
    }

    /*
     * Requests the selected method's challenge and returns the data needed for verification.
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

        return this.toChallengeResult(parsedResponse);
    }

    /*
     * Verifies the submitted credential and returns the server-directed next action.
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

    private async sendStartRequest(
        startHref: string,
        request: PasswordResetStartRequestV2 | SignInStartRequestV2,
        context: RequestContextV2
    ): Promise<StartResultV2> {
        const parsedResponse = await this.sendActionRequest<
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
            authenticationFactor: this.resolveAuthenticationFactor(
                parsedResponse.body.challengeContext?.authenticationFactor,
                parsedResponse.correlationId
            ),
            scenario: parsedResponse.body.scenario,
        };
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
                nextAction: VerifyNextActionV2.CONTINUE,
                continuationToken,
            };
        }

        if (parsedResponse.body.action === UPDATE_RELATION) {
            return {
                nextAction: VerifyNextActionV2.UPDATE,
                continuationToken,
                updateHref: this.handler.requireHref(
                    parsedResponse.body._links?.update?.href,
                    "update",
                    correlationId
                ),
            };
        }

        if (parsedResponse.body.action === CHALLENGE_RELATION) {
            return {
                nextAction: VerifyNextActionV2.CHALLENGE,
                continuationToken,
                authenticationFactor: this.resolveAuthenticationFactor(
                    parsedResponse.body.challengeContext?.authenticationFactor,
                    correlationId
                ),
                methods: this.resolveMethods(
                    parsedResponse.body,
                    correlationId
                ),
            };
        }

        throw new CustomAuthApiError(
            INVALID_HAL_RESPONSE,
            "Invalid HAL response: verify returned no known next action",
            correlationId
        );
    }

    private resolveAuthenticationFactor(
        authenticationFactor: string | undefined,
        correlationId: string
    ): AuthenticationFactorV2 {
        if (
            authenticationFactor === AuthenticationFactorV2.SINGLE_FACTOR ||
            authenticationFactor === AuthenticationFactorV2.MULTI_FACTOR
        ) {
            return authenticationFactor;
        }

        const message = authenticationFactor
            ? `Unexpected authentication factor '${authenticationFactor}'.`
            : "The response did not include an authentication factor.";
        this.logger?.error(message, correlationId);

        throw new CustomAuthApiError(
            UNEXPECTED_AUTHENTICATION_FACTOR,
            message,
            correlationId
        );
    }

    private toChallengeResult(
        parsedResponse: ParsedResponseV2<ChallengeResponseV2>
    ): ChallengeResultV2 {
        const continuationToken = this.handler.requireContinuationToken(
            parsedResponse.continuationToken,
            parsedResponse.correlationId
        );
        const links = parsedResponse.body._links;
        const codeMetadata =
            "hint" in parsedResponse.body ||
            "codeLength" in parsedResponse.body ||
            "payload" in parsedResponse.body
                ? parsedResponse.body
                : undefined;

        return {
            continuationToken,
            verifyHref: this.handler.requireHref(
                links?.verify?.href,
                "verify",
                parsedResponse.correlationId
            ),
            resendHref:
                links && "resend" in links ? links.resend?.href : undefined,
            codeLength:
                codeMetadata?.codeLength ?? codeMetadata?.payload?.codeLength,
            hint: codeMetadata?.hint,
            type: parsedResponse.body.type,
        };
    }

    private resolveMethods(
        body: {
            _embedded?: {
                methods?: EmbeddedMethodV2[];
            };
        },
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

            throw new CustomAuthApiError(
                NO_AUTHENTICATION_METHODS,
                "The flow-start response contains no authentication method with a challenge link",
                correlationId
            );
        }

        return resolved;
    }
}
