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
    ChallengeVerificationResultV2,
    VerifyResultV2,
    AuthenticationFactorV2,
    ActivationResultV2,
    EnrollmentResultV2,
    EnrollmentMethodV2,
} from "./result/BaseResultsV2.js";
import {
    SignUpStartApiResultV2,
    SignUpSubmitAttributesApiResultV2,
    SignUpSubmitAttributesNextActionV2,
} from "./result/SignUpResultsV2.js";
import {
    PasswordResetStartResponseV2,
    SignInStartResponseV2,
    SignUpStartResponseV2,
    SignUpSubmitAttributesResponseV2,
    ChallengeResponseV2,
    RiskVerificationRequiredResponseV2,
    RiskVerificationResponseV2,
    VerificationChallengeResponseV2,
    VerifyResponseV2,
    UpdatePasswordResponseV2,
    PollResponseV2,
    ParsedResponseV2,
    EmbeddedMethodV2,
    EmbeddedEnrollmentMethodV2,
    EnrollmentResponseV2,
    HalResponseBaseV2,
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
    AuthMethodRegistrationRequestV2,
    AuthMethodRegistrationVerificationRequestV2,
} from "./request/RequestsV2.js";
import {
    CHALLENGE_RELATION,
    COLLECT_ATTRIBUTES_RELATION,
    UPDATE_RELATION,
    VERIFY_RELATION,
    RISK_VERIFY_RELATION,
    AuthenticationMethodTypeV2,
    ResponseStateV2,
    ACTIVATE_RELATION,
    ENROLL_RELATION,
    RESEND_RELATION,
    POLL_RELATION,
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
    ): Promise<SignUpSubmitAttributesApiResultV2> {
        const parsedResponse =
            await this.sendActionRequest<SignUpSubmitAttributesResponseV2>(
                submitAttributesHref,
                HttpMethod.POST,
                request,
                context
            );

        const correlationId = parsedResponse.correlationId;
        const continuationToken = this.handler.requireContinuationToken(
            parsedResponse.continuationToken,
            correlationId
        );

        if (parsedResponse.body.state === ResponseStateV2.CONTINUE) {
            return {
                nextAction: SignUpSubmitAttributesNextActionV2.CONTINUE,
                continuationToken,
            };
        }

        if (parsedResponse.body.action === COLLECT_ATTRIBUTES_RELATION) {
            return {
                nextAction:
                    SignUpSubmitAttributesNextActionV2.COLLECT_ATTRIBUTES,
                continuationToken,
                attributes: parsedResponse.body.attributes ?? [],
                submitAttributesHref: this.handler.requireHref(
                    parsedResponse.body._links?.submitAttributes?.href,
                    "submitAttributes",
                    correlationId
                ),
            };
        }

        if (parsedResponse.body.action === VERIFY_RELATION) {
            return {
                ...this.toChallengeVerificationResult(parsedResponse),
                attributes: parsedResponse.body.attributes,
            };
        }

        if (parsedResponse.body.action === ENROLL_RELATION) {
            return {
                nextAction: ENROLL_RELATION,
                continuationToken,
                methods: this.resolveEnrollmentMethods(
                    this.handler.requireMethods(
                        parsedResponse.body._embedded?.methods,
                        correlationId
                    ),
                    correlationId
                ),
            };
        }

        const message =
            "Invalid HAL response: sign-up attribute submission returned no known next action";
        this.logger?.error(message, correlationId);

        throw new CustomAuthApiError(
            INVALID_HAL_RESPONSE,
            message,
            correlationId
        );
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

    async verifyRisk(
        riskVerifyHref: string,
        request: ChallengeRequestV2,
        context: RequestContextV2
    ): Promise<ChallengeVerificationResultV2> {
        const parsedResponse =
            await this.sendActionRequest<RiskVerificationResponseV2>(
                riskVerifyHref,
                HttpMethod.POST,
                request,
                context
            );

        if (parsedResponse.body.action !== VERIFY_RELATION) {
            throw new CustomAuthApiError(
                INVALID_HAL_RESPONSE,
                "Invalid HAL response: SMS risk verification returned no known next action",
                parsedResponse.correlationId
            );
        }

        if (
            parsedResponse.body.type?.toLowerCase() !==
            AuthenticationMethodTypeV2.SMS
        ) {
            throw new CustomAuthApiError(
                INVALID_HAL_RESPONSE,
                "Invalid HAL response: SMS risk verification returned a non-SMS challenge",
                parsedResponse.correlationId
            );
        }

        return this.toChallengeVerificationResult(parsedResponse);
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

    async enrollAuthMethod(
        enrollHref: string,
        request: AuthMethodRegistrationRequestV2,
        context: RequestContextV2
    ): Promise<EnrollmentResultV2> {
        return this.sendEnrollmentRequest(enrollHref, request, context);
    }

    async resendAuthMethodRegistrationChallenge(
        resendHref: string,
        request: ChallengeRequestV2,
        context: RequestContextV2
    ): Promise<EnrollmentResultV2> {
        return this.sendEnrollmentRequest(resendHref, request, context);
    }

    private async sendEnrollmentRequest(
        href: string,
        request: ChallengeRequestV2,
        context: RequestContextV2
    ): Promise<EnrollmentResultV2> {
        const parsedResponse =
            await this.sendActionRequest<EnrollmentResponseV2>(
                href,
                HttpMethod.POST,
                request,
                context
            );

        if (parsedResponse.body.action !== ACTIVATE_RELATION) {
            throw new CustomAuthApiError(
                INVALID_HAL_RESPONSE,
                "Invalid HAL response: enrollment returned no activation action",
                parsedResponse.correlationId
            );
        }

        const links = parsedResponse.body._links;

        return {
            nextAction: ACTIVATE_RELATION,
            continuationToken: this.handler.requireContinuationToken(
                parsedResponse.continuationToken,
                parsedResponse.correlationId
            ),
            hint: parsedResponse.body.hint,
            codeLength: this.normalizeCodeLength(
                parsedResponse.body.codeLength
            ),
            activateHref: this.handler.requireHref(
                links?.activate?.href,
                ACTIVATE_RELATION,
                parsedResponse.correlationId
            ),
            resendHref:
                links && "resend" in links
                    ? this.handler.requireHref(
                          links.resend?.href,
                          RESEND_RELATION,
                          parsedResponse.correlationId
                      )
                    : undefined,
        };
    }

    async activateAuthMethod(
        activateHref: string,
        request: AuthMethodRegistrationVerificationRequestV2,
        context: RequestContextV2
    ): Promise<ActivationResultV2> {
        const parsedResponse = await this.sendActionRequest<HalResponseBaseV2>(
            activateHref,
            HttpMethod.POST,
            request,
            context
        );

        if (parsedResponse.body.state !== ResponseStateV2.CONTINUE) {
            throw new CustomAuthApiError(
                INVALID_HAL_RESPONSE,
                "Invalid HAL response: activation returned no continuation state",
                parsedResponse.correlationId
            );
        }

        return {
            nextAction: ResponseStateV2.CONTINUE,
            continuationToken: this.handler.requireContinuationToken(
                parsedResponse.continuationToken,
                parsedResponse.correlationId
            ),
        };
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
     * Sends a poll request and validates the data needed for the next flow step.
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

        const correlationId = parsedResponse.correlationId;
        const continuationToken = this.handler.requireContinuationToken(
            parsedResponse.continuationToken,
            correlationId
        );
        const nextAction =
            parsedResponse.body.action ?? parsedResponse.body.state;

        if (nextAction === ENROLL_RELATION) {
            return {
                nextAction,
                continuationToken,
                enrollmentMethods: this.resolveEnrollmentMethods(
                    this.handler.requireMethods(
                        parsedResponse.body._embedded?.methods,
                        correlationId
                    ),
                    correlationId
                ),
            };
        }

        if (nextAction === POLL_RELATION) {
            return {
                nextAction: POLL_RELATION,
                continuationToken,
                pollHref: this.handler.requireHref(
                    parsedResponse.body._links?.poll?.href,
                    POLL_RELATION,
                    correlationId
                ),
            };
        }

        if (nextAction === ResponseStateV2.CONTINUE) {
            return {
                nextAction,
                continuationToken,
            };
        }

        const message = `Password reset poll next action '${nextAction}' is not supported.`;
        this.logger?.error(message, correlationId);
        throw new CustomAuthApiError(
            INVALID_HAL_RESPONSE,
            message,
            correlationId
        );
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
                this.handler.requireMethods(
                    parsedResponse.body._embedded?.methods,
                    parsedResponse.correlationId
                ),
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
                nextAction: ResponseStateV2.CONTINUE,
                continuationToken,
            };
        }

        if (parsedResponse.body.action === COLLECT_ATTRIBUTES_RELATION) {
            return {
                nextAction: COLLECT_ATTRIBUTES_RELATION,
                continuationToken,
                attributes: parsedResponse.body.attributes ?? [],
                submitAttributesHref: this.handler.requireHref(
                    parsedResponse.body._links?.submitAttributes?.href,
                    "submitAttributes",
                    correlationId
                ),
            };
        }

        if (parsedResponse.body.action === UPDATE_RELATION) {
            return {
                nextAction: UPDATE_RELATION,
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
                nextAction: CHALLENGE_RELATION,
                continuationToken,
                authenticationFactor: this.resolveAuthenticationFactor(
                    parsedResponse.body.challengeContext?.authenticationFactor,
                    correlationId
                ),
                methods: this.resolveMethods(
                    this.handler.requireMethods(
                        parsedResponse.body._embedded?.methods,
                        correlationId
                    ) as EmbeddedMethodV2[],
                    correlationId
                ),
            };
        }

        if (parsedResponse.body.action === ENROLL_RELATION) {
            return {
                nextAction: ENROLL_RELATION,
                continuationToken,
                methods: this.resolveEnrollmentMethods(
                    this.handler.requireMethods(
                        parsedResponse.body._embedded?.methods,
                        correlationId
                    ) as EmbeddedEnrollmentMethodV2[],
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

    private resolveEnrollmentMethods(
        methods: EmbeddedEnrollmentMethodV2[],
        correlationId: string
    ): EnrollmentMethodV2[] {
        return methods.map((method) => {
            if (typeof method.type !== "string" || !method.type.trim()) {
                throw new CustomAuthApiError(
                    INVALID_HAL_RESPONSE,
                    "Invalid HAL response: enrollment method type is malformed",
                    correlationId
                );
            }

            if (
                method.channels !== undefined &&
                (!Array.isArray(method.channels) ||
                    method.channels.length === 0)
            ) {
                throw new CustomAuthApiError(
                    INVALID_HAL_RESPONSE,
                    "Invalid HAL response: enrollment method channels are malformed",
                    correlationId
                );
            }

            return {
                type: method.type,
                channels: method.channels,
                enrollHref: this.handler.requireHref(
                    method._links?.enroll?.href,
                    ENROLL_RELATION,
                    correlationId
                ),
            };
        });
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
        if (parsedResponse.body.action === RISK_VERIFY_RELATION) {
            const riskResponse =
                parsedResponse.body as RiskVerificationRequiredResponseV2;

            return {
                nextAction: RISK_VERIFY_RELATION,
                continuationToken: this.handler.requireContinuationToken(
                    parsedResponse.continuationToken,
                    parsedResponse.correlationId
                ),
                riskVerifyHref: this.handler.requireHref(
                    riskResponse._links?.riskverify?.href,
                    RISK_VERIFY_RELATION,
                    parsedResponse.correlationId
                ),
            };
        }

        if (parsedResponse.body.action === VERIFY_RELATION) {
            return this.toChallengeVerificationResult(
                parsedResponse as ParsedResponseV2<VerificationChallengeResponseV2>
            );
        }

        throw new CustomAuthApiError(
            INVALID_HAL_RESPONSE,
            "Invalid HAL response: challenge returned no known next action",
            parsedResponse.correlationId
        );
    }

    private toChallengeVerificationResult(
        parsedResponse: ParsedResponseV2<VerificationChallengeResponseV2>
    ): ChallengeVerificationResultV2 {
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
        const isPasswordChallenge =
            parsedResponse.body.type?.toLowerCase() ===
            AuthenticationMethodTypeV2.PASSWORD;
        const verifyHref = this.handler.requireHref(
            links?.verify?.href,
            VERIFY_RELATION,
            parsedResponse.correlationId
        );
        const resendHref =
            !isPasswordChallenge && links && "resend" in links
                ? this.handler.requireHref(
                      links.resend?.href,
                      RESEND_RELATION,
                      parsedResponse.correlationId
                  )
                : undefined;
        const codeLength = isPasswordChallenge
            ? undefined
            : this.normalizeCodeLength(
                  codeMetadata?.codeLength ?? codeMetadata?.payload?.codeLength
              );

        return {
            nextAction: VERIFY_RELATION,
            continuationToken,
            verifyHref,
            resendHref,
            codeLength,
            hint: codeMetadata?.hint,
            type: parsedResponse.body.type,
        };
    }

    private normalizeCodeLength(value: unknown): number {
        return typeof value === "number" && Number.isInteger(value) ? value : 0;
    }

    private resolveMethods(
        methods: EmbeddedMethodV2[],
        correlationId: string
    ): StartMethodV2[] {
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
