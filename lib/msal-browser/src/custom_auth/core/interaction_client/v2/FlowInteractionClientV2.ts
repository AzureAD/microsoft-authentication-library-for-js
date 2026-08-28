/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ICrypto,
    IPerformanceClient,
    Logger,
} from "@azure/msal-common/browser";
import { InteractionClientBaseV2 } from "./InteractionClientBaseV2.js";
import {
    FlowStartParamsV2,
    FlowSignInStartParamsV2,
    FlowChallengeParamsV2,
    FlowSubmitCodeParamsV2,
    FlowSubmitNewPasswordParamsV2,
    FlowSubmitSignInPasswordParamsV2,
    FlowSignInWithContinuationParamsV2,
} from "./parameter/FlowParamsV2.js";
import {
    createFlowMethodSelectionRequiredResultV2,
    createFlowCodeRequiredResultV2,
    createFlowPasswordRequiredResultV2,
    createFlowMFARequiredResultV2,
    createFlowNewPasswordRequiredResultV2,
    createFlowSignInContinuationRequiredResultV2,
    createFlowCompletedResultV2,
    FLOW_CODE_REQUIRED_V2,
    FLOW_PASSWORD_REQUIRED_V2,
} from "./result/FlowActionResultV2.js";
import type {
    FlowMethodSelectionRequiredResultV2,
    FlowCodeRequiredResultV2,
    FlowSignInCodeRequiredResultV2,
    FlowResetPasswordCodeRequiredResultV2,
    FlowPasswordRequiredResultV2,
    FlowMFARequiredResultV2,
    FlowNewPasswordRequiredResultV2,
    FlowSignInContinuationRequiredResultV2,
    FlowCompletedResultV2,
} from "./result/FlowActionResultV2.js";
import { BrowserConfiguration } from "../../../../config/Configuration.js";
import { BrowserCacheManager } from "../../../../cache/BrowserCacheManager.js";
import { EventHandler } from "../../../../event/EventHandler.js";
import { INavigationClient } from "../../../../navigation/INavigationClient.js";
import { CustomAuthAuthority } from "../../CustomAuthAuthority.js";
import { CustomAuthApiClientV2 } from "../../network_client/custom_auth_api/v2/CustomAuthApiClientV2.js";
import { CustomAuthError } from "../../error/CustomAuthError.js";
import {
    CONTINUATION_LINK_MISSING,
    RESET_PASSWORD_UNSUPPORTED,
    RESET_PASSWORD_TIMEOUT,
    SIGN_IN_UNSUPPORTED,
    UNSUPPORTED_FLOW_STEP,
    UNSUPPORTED_FLOW_TRANSITION,
} from "../../network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { CustomAuthFlowScenarioV2 } from "../../auth_flow/v2/CustomAuthFlowScenarioV2.js";
import * as PublicApiId from "../../telemetry/PublicApiId.js";
import {
    getPublicApiIdV2,
    FlowStepV2,
} from "../../telemetry/FlowApiIdHelperV2.js";
import type {
    ChallengeResultV2,
    VerifyResultV2,
} from "../../network_client/custom_auth_api/v2/result/BaseResultsV2.js";
import { VerifyNextActionV2 } from "../../network_client/custom_auth_api/v2/result/BaseResultsV2.js";
import { AuthenticationFactorV2 } from "../../network_client/custom_auth_api/v2/result/BaseResultsV2.js";
import type { FlowContinuationStateV2 } from "./FlowContinuationStateV2.js";
import type { AuthenticationMethodV2 } from "../../auth_flow/v2/AuthenticationMethodV2.js";

/*
 * Polls up to five times for password-update completion, waiting 1.5 seconds
 * between attempts. The first request runs immediately.
 */
const POLL_MAX_ATTEMPTS = 5;
// TODO: Replace this fallback with the server-provided polling interval once available.
const POLL_INTERVAL_MS = 1500;

const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

/*
 * Drives server-directed Native Auth V2 flows using opaque continuation state
 * and HAL links. Results use the shared `FlowActionResultV2` envelope.
 */
export class FlowInteractionClientV2 extends InteractionClientBaseV2 {
    constructor(
        config: BrowserConfiguration,
        storageImpl: BrowserCacheManager,
        browserCrypto: ICrypto,
        logger: Logger,
        eventHandler: EventHandler,
        navigationClient: INavigationClient,
        performanceClient: IPerformanceClient,
        customAuthAuthority: CustomAuthAuthority,
        protected apiClient: CustomAuthApiClientV2
    ) {
        super(
            config,
            storageImpl,
            browserCrypto,
            logger,
            eventHandler,
            navigationClient,
            performanceClient,
            customAuthAuthority
        );
    }

    /*
     * Starts sign-in using the preferred supported method offered by the server.
     */
    async signIn(
        parameters: FlowSignInStartParamsV2
    ): Promise<
        | FlowPasswordRequiredResultV2
        | FlowSignInCodeRequiredResultV2
        | FlowMFARequiredResultV2
        | FlowCompletedResultV2
    > {
        const correlationId = parameters.correlationId;
        const context = this.createRequestContext(
            PublicApiId.SIGN_IN_V2_START,
            correlationId
        );

        this.logger.verbose("Starting V2 sign-in.", correlationId);

        const entryResult = await this.apiClient.authorizeChallengeStart(
            context
        );
        const startResult = await this.apiClient.signInStart(
            this.requireLink(correlationId, entryResult.signInHref, {
                code: SIGN_IN_UNSUPPORTED,
                message:
                    "The authorize-challenge entry response did not include a sign-in link.",
            }),
            {
                continuationToken: entryResult.continuationToken,
                username: parameters.username,
            },
            context
        );
        this.ensureAuthenticationFactor(
            startResult.authenticationFactor,
            AuthenticationFactorV2.SINGLE_FACTOR,
            "sign-in start",
            correlationId
        );

        const continuationState: FlowContinuationStateV2 = {
            continuationToken: startResult.continuationToken,
            scenario: CustomAuthFlowScenarioV2.SignIn,
            links: {},
            tokenRequest: {
                scopes: parameters.scopes,
            },
        };
        const methods = startResult.methods.map((method) => ({
            id: method.id,
            type: method.type ?? "",
            hint: method.hint,
            challengeHref: method.challengeHref,
        }));
        const selectedMethod = this.selectSignInMethod(
            methods,
            parameters.password !== undefined,
            correlationId
        );

        const challengeResult = await this.requestChallenge({
            correlationId,
            continuationState: {
                ...continuationState,
                links: {
                    ...continuationState.links,
                    challenge: selectedMethod.challengeHref,
                },
            },
        });

        if (challengeResult.type === FLOW_CODE_REQUIRED_V2) {
            return {
                ...challengeResult,
                method: selectedMethod,
            };
        }

        if (parameters.password) {
            return this.submitSignInPassword({
                correlationId,
                continuationState: challengeResult.continuationState,
                password: parameters.password,
            });
        }

        return challengeResult;
    }

    /*
     * Starts password reset, automatically challenging a sole method or
     * returning multiple methods for selection.
     */
    async resetPassword(
        parameters: FlowStartParamsV2
    ): Promise<
        | FlowMethodSelectionRequiredResultV2
        | FlowResetPasswordCodeRequiredResultV2
    > {
        const correlationId = parameters.correlationId;
        const context = this.createRequestContext(
            PublicApiId.RESET_PASSWORD_V2_START,
            correlationId
        );

        this.logger.verbose(
            "Starting V2 self-service password reset.",
            correlationId
        );

        const entryResult = await this.apiClient.authorizeChallengeStart(
            context
        );
        const startResult = await this.apiClient.resetPasswordStart(
            this.requireLink(correlationId, entryResult.resetPasswordHref, {
                code: RESET_PASSWORD_UNSUPPORTED,
                message:
                    "The authorize-challenge entry response did not include a reset-password link.",
            }),
            {
                username: parameters.username,
                continuationToken: entryResult.continuationToken,
            },
            context
        );
        this.ensureAuthenticationFactor(
            startResult.authenticationFactor,
            AuthenticationFactorV2.SINGLE_FACTOR,
            "password-reset start",
            correlationId
        );
        const continuationState: FlowContinuationStateV2 = {
            continuationToken: startResult.continuationToken,
            scenario: CustomAuthFlowScenarioV2.PasswordReset,
            links: {},
        };
        const methods = startResult.methods.map((method) => ({
            id: method.id,
            type: method.type ?? "",
            hint: method.hint,
            challengeHref: method.challengeHref,
        }));

        if (methods.length === 0) {
            const message =
                "The password-reset start response did not include an authentication method.";
            this.logger.error(message, correlationId);
            throw new CustomAuthError(
                UNSUPPORTED_FLOW_TRANSITION,
                message,
                correlationId
            );
        }

        if (methods.length === 1) {
            const selectedMethod = methods[0];
            const challengeResult = await this.requestChallenge({
                correlationId,
                continuationState: {
                    ...continuationState,
                    links: {
                        challenge: selectedMethod.challengeHref,
                    },
                },
            });

            if (
                challengeResult.type === FLOW_CODE_REQUIRED_V2 &&
                challengeResult.channel?.toLowerCase() === "email"
            ) {
                return {
                    ...challengeResult,
                    method: selectedMethod,
                };
            }

            const channel =
                challengeResult.type === FLOW_CODE_REQUIRED_V2
                    ? challengeResult.channel
                    : "password";
            const message = `Challenge type '${challengeResult.type}' with channel '${channel}' is not supported for password reset.`;
            this.logger.error(message, correlationId);
            throw new CustomAuthError(
                UNSUPPORTED_FLOW_TRANSITION,
                message,
                correlationId
            );
        }

        this.logger.verbose(
            "V2 self-service password reset method selection required.",
            correlationId
        );

        return createFlowMethodSelectionRequiredResultV2({
            correlationId,
            continuationState,
            methods,
        });
    }

    /*
     * Requests a one-time code for the selected authentication method. Returns
     * the continuation state and code metadata needed for verification.
     */
    async requestChallenge(
        parameters: FlowChallengeParamsV2
    ): Promise<FlowCodeRequiredResultV2 | FlowPasswordRequiredResultV2> {
        const challengeResult = await this.sendMethodChallenge(
            parameters,
            "requestChallenge"
        );
        const challengeType = challengeResult.type ?? "email";
        const continuationState = this.createChallengeContinuationState(
            parameters.continuationState,
            challengeResult
        );

        if (challengeType.toLowerCase() === "password") {
            return createFlowPasswordRequiredResultV2({
                correlationId: parameters.correlationId,
                continuationState,
            });
        }

        return createFlowCodeRequiredResultV2({
            correlationId: parameters.correlationId,
            continuationState,
            channel: challengeType,
            sentTo: challengeResult.hint,
            codeLength: challengeResult.codeLength,
        });
    }

    /*
     * Verifies the submitted one-time code using the server-provided link. The
     * response determines the next required action.
     */
    async submitCode(
        parameters: FlowSubmitCodeParamsV2
    ): Promise<FlowNewPasswordRequiredResultV2 | FlowCompletedResultV2> {
        const continuationState = parameters.continuationState;
        const correlationId = parameters.correlationId;
        const context = this.createRequestContext(
            this.resolveStepApiId(
                continuationState.scenario,
                "submitCode",
                correlationId
            ),
            correlationId
        );

        this.logger.verbose("Submitting V2 one-time code.", correlationId);

        const verifyResult = await this.apiClient.verifyChallenge(
            this.requireLink(correlationId, continuationState.links.verify),
            {
                continuationToken: continuationState.continuationToken,
                otp: parameters.code,
            },
            context
        );

        if (
            continuationState.scenario ===
                CustomAuthFlowScenarioV2.PasswordReset &&
            verifyResult.nextAction === VerifyNextActionV2.UPDATE
        ) {
            return createFlowNewPasswordRequiredResultV2({
                correlationId,
                continuationState: {
                    continuationToken: verifyResult.continuationToken,
                    scenario: continuationState.scenario,
                    links: { update: verifyResult.updateHref },
                },
            });
        }

        if (
            continuationState.scenario === CustomAuthFlowScenarioV2.SignIn &&
            verifyResult.nextAction === VerifyNextActionV2.CONTINUE
        ) {
            return this.completeSignInAfterVerification(
                continuationState,
                verifyResult.continuationToken,
                correlationId
            );
        }

        const message = `Verification next action '${verifyResult.nextAction}' is not supported for the '${continuationState.scenario}' flow.`;
        this.logger.error(message, correlationId);

        throw new CustomAuthError(
            UNSUPPORTED_FLOW_TRANSITION,
            message,
            correlationId
        );
    }

    /*
     * Requests a new one-time code using the server-provided resend link.
     * Returns refreshed continuation state and code metadata.
     */
    async resendCode(
        parameters: FlowChallengeParamsV2
    ): Promise<FlowCodeRequiredResultV2> {
        const challengeResult = await this.sendMethodChallenge(
            parameters,
            "resendCode"
        );

        return createFlowCodeRequiredResultV2({
            correlationId: parameters.correlationId,
            continuationState: this.createChallengeContinuationState(
                parameters.continuationState,
                challengeResult
            ),
            channel: challengeResult.type,
            sentTo: challengeResult.hint,
            codeLength: challengeResult.codeLength,
        });
    }

    /*
     * Submits the new password and polls until the reset completes. The result
     * contains the continuation state required for explicit sign-in.
     */
    async submitNewPassword(
        parameters: FlowSubmitNewPasswordParamsV2
    ): Promise<FlowSignInContinuationRequiredResultV2> {
        const continuationState = parameters.continuationState;
        const correlationId = parameters.correlationId;
        const context = this.createRequestContext(
            this.resolveStepApiId(
                continuationState.scenario,
                "submitNewPassword",
                correlationId
            ),
            correlationId
        );

        this.logger.verbose("Submitting V2 new password.", correlationId);

        const updateResult = await this.apiClient.submitNewPassword(
            this.requireLink(correlationId, continuationState.links.update),
            {
                continuationToken: continuationState.continuationToken,
                newPassword: parameters.newPassword,
            },
            context
        );

        let pollToken = updateResult.continuationToken;
        let pollHref = updateResult.pollHref;
        let completionToken: string | undefined;
        let continueHref: string | undefined;

        for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt++) {
            const pollResult = await this.apiClient.poll(
                pollHref,
                { continuationToken: pollToken },
                context
            );

            if (pollResult.isCompleted) {
                completionToken = pollResult.continuationToken;
                continueHref = pollResult.continueHref;
                break;
            }

            pollToken = pollResult.continuationToken;
            pollHref = pollResult.pollHref ?? pollHref;

            if (attempt < POLL_MAX_ATTEMPTS) {
                await delay(POLL_INTERVAL_MS);
            }
        }

        if (!completionToken) {
            const message =
                "The password reset did not complete within the allotted number of polling attempts.";
            this.logger.error(message, correlationId);

            throw new CustomAuthError(
                RESET_PASSWORD_TIMEOUT,
                message,
                correlationId
            );
        }

        this.logger.verbose(
            "V2 password reset applied; sign-in required.",
            correlationId
        );

        return createFlowSignInContinuationRequiredResultV2({
            correlationId,
            continuationState: {
                continuationToken: completionToken,
                scenario: continuationState.scenario,
                links: { continue: continueHref },
            },
        });
    }

    /*
     * Verifies a sign-in password and returns the next sign-in action.
     */
    async submitSignInPassword(
        parameters: FlowSubmitSignInPasswordParamsV2
    ): Promise<FlowMFARequiredResultV2 | FlowCompletedResultV2> {
        const verifyResult = await this.verifySignInPassword(parameters);

        return this.handleSignInPasswordVerification(
            parameters.continuationState,
            verifyResult,
            parameters.correlationId
        );
    }

    /*
     * Redeems the completed flow continuation for tokens. Returns the
     * authentication result after validating and caching the response.
     */
    async signInWithContinuation(
        parameters: FlowSignInWithContinuationParamsV2
    ): Promise<FlowCompletedResultV2> {
        const continuationState = parameters.continuationState;
        const correlationId = parameters.correlationId;
        const apiId = this.resolveStepApiId(
            continuationState.scenario,
            "signInWithContinuation",
            correlationId
        );
        const context = this.createRequestContext(apiId, correlationId);

        this.logger.verbose(
            "Signing in with a V2 continuation.",
            correlationId
        );

        const scopes = this.getScopes(parameters.scopes);

        const tokenResponse = await this.apiClient.completeWithTokens(
            {
                continuationToken: continuationState.continuationToken,
                scopes,
            },
            context
        );

        const authenticationResult = await this.handleTokenResponse(
            tokenResponse,
            scopes,
            correlationId,
            apiId
        );

        this.logger.verbose(
            "V2 continuation sign-in completed.",
            correlationId
        );

        return createFlowCompletedResultV2({
            correlationId,
            authenticationResult,
        });
    }

    private async handleSignInPasswordVerification(
        continuationState: FlowContinuationStateV2,
        verifyResult: VerifyResultV2,
        correlationId: string
    ): Promise<FlowMFARequiredResultV2 | FlowCompletedResultV2> {
        if (verifyResult.nextAction === VerifyNextActionV2.CHALLENGE) {
            this.ensureAuthenticationFactor(
                verifyResult.authenticationFactor,
                AuthenticationFactorV2.MULTI_FACTOR,
                "after password verification",
                correlationId
            );

            return createFlowMFARequiredResultV2({
                correlationId,
                continuationState: {
                    continuationToken: verifyResult.continuationToken,
                    scenario: continuationState.scenario,
                    links: {},
                    tokenRequest: continuationState.tokenRequest,
                },
                methods: verifyResult.methods.map((method) => ({
                    id: method.id,
                    type: method.type ?? "",
                    hint: method.hint,
                    challengeHref: method.challengeHref,
                })),
            });
        }

        if (verifyResult.nextAction === VerifyNextActionV2.CONTINUE) {
            return this.completeSignInAfterVerification(
                continuationState,
                verifyResult.continuationToken,
                correlationId
            );
        }

        const message = `Password verification next action '${verifyResult.nextAction}' is not supported for sign-in.`;
        this.logger.error(message, correlationId);
        throw new CustomAuthError(
            UNSUPPORTED_FLOW_TRANSITION,
            message,
            correlationId
        );
    }

    private selectSignInMethod(
        methods: AuthenticationMethodV2[],
        passwordProvided: boolean,
        correlationId: string
    ): AuthenticationMethodV2 {
        const passwordMethod = methods.find(
            (method) => method.type.toLowerCase() === "password"
        );
        const emailMethod = methods.find(
            (method) => method.type.toLowerCase() === "email"
        );

        if (passwordProvided) {
            // Use the supplied password when supported; otherwise fall back to email OTP.
            const selectedMethod = passwordMethod ?? emailMethod;
            if (selectedMethod) {
                return selectedMethod;
            }
        } else {
            // Without a password, prefer email OTP; otherwise ask for a password afterward.
            const selectedMethod = emailMethod ?? passwordMethod;
            if (selectedMethod) {
                return selectedMethod;
            }
        }

        const message =
            "The sign-in start response did not include a supported email or password method.";
        this.logger.error(message, correlationId);
        throw new CustomAuthError(
            UNSUPPORTED_FLOW_TRANSITION,
            message,
            correlationId
        );
    }

    private ensureAuthenticationFactor(
        authenticationFactor: AuthenticationFactorV2,
        expectedFactor: AuthenticationFactorV2,
        transition: string,
        correlationId: string
    ): void {
        if (authenticationFactor === expectedFactor) {
            return;
        }

        const message = `Authentication factor '${authenticationFactor}' is not supported for ${transition}.`;
        this.logger.error(message, correlationId);
        throw new CustomAuthError(
            UNSUPPORTED_FLOW_TRANSITION,
            message,
            correlationId
        );
    }

    private async verifySignInPassword(
        parameters: FlowSubmitSignInPasswordParamsV2
    ): Promise<VerifyResultV2> {
        const { continuationState, correlationId } = parameters;
        const context = this.createRequestContext(
            this.resolveStepApiId(
                continuationState.scenario,
                "submitPassword",
                correlationId
            ),
            correlationId
        );

        this.logger.verbose("Submitting V2 sign-in password.", correlationId);

        return this.apiClient.verifyChallenge(
            this.requireLink(correlationId, continuationState.links.verify),
            {
                continuationToken: continuationState.continuationToken,
                password: parameters.password,
            },
            context
        );
    }

    private completeSignInAfterVerification(
        continuationState: FlowContinuationStateV2,
        continuationToken: string,
        correlationId: string
    ): Promise<FlowCompletedResultV2> {
        return this.signInWithContinuation({
            correlationId,
            continuationState: {
                continuationToken,
                scenario: continuationState.scenario,
                links: {},
                tokenRequest: continuationState.tokenRequest,
            },
            scopes: continuationState.tokenRequest?.scopes,
        });
    }

    private async sendMethodChallenge(
        parameters: FlowChallengeParamsV2,
        step: "requestChallenge" | "resendCode"
    ): Promise<ChallengeResultV2> {
        const continuationState = parameters.continuationState;
        const correlationId = parameters.correlationId;
        const challengeHref =
            step === "resendCode"
                ? continuationState.links.resend
                : continuationState.links.challenge;
        const context = this.createRequestContext(
            this.resolveStepApiId(
                continuationState.scenario,
                step,
                correlationId
            ),
            correlationId
        );

        this.logger.verbose(
            step === "resendCode"
                ? "Resending V2 one-time code."
                : "Requesting V2 challenge.",
            correlationId
        );

        return this.apiClient.requestChallenge(
            this.requireLink(correlationId, challengeHref),
            { continuationToken: continuationState.continuationToken },
            context
        );
    }

    private createChallengeContinuationState(
        continuationState: FlowContinuationStateV2,
        challengeResult: ChallengeResultV2
    ): FlowContinuationStateV2 {
        return {
            continuationToken: challengeResult.continuationToken,
            scenario: continuationState.scenario,
            links: {
                challenge: continuationState.links.challenge,
                verify: challengeResult.verifyHref,
                resend:
                    challengeResult.resendHref ??
                    continuationState.links.resend,
            },
            ...(continuationState.tokenRequest && {
                tokenRequest: continuationState.tokenRequest,
            }),
        };
    }

    private resolveStepApiId(
        scenario: CustomAuthFlowScenarioV2,
        step: FlowStepV2,
        correlationId: string
    ): number {
        const apiId = getPublicApiIdV2(scenario, step);

        if (apiId === undefined) {
            const message = `No telemetry API id is registered for step '${step}' of the '${scenario}' flow.`;
            this.logger.error(message, correlationId);

            throw new CustomAuthError(
                UNSUPPORTED_FLOW_STEP,
                message,
                correlationId
            );
        }

        return apiId;
    }

    private requireLink(
        correlationId: string,
        href: string | undefined,
        missingLinkError?: { code: string; message: string }
    ): string {
        if (!href) {
            const errorCode =
                missingLinkError?.code ?? CONTINUATION_LINK_MISSING;
            const message =
                missingLinkError?.message ??
                "The continuation state is missing a link required to advance the flow.";
            this.logger.error(message, correlationId);

            throw new CustomAuthError(errorCode, message, correlationId);
        }

        return href;
    }
}
