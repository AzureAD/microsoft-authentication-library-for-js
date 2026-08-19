/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    ICrypto,
    IPerformanceClient,
    Logger,
} from "@azure/msal-common/browser";
import { V2InteractionClientBase } from "./V2InteractionClientBase.js";
import {
    V2FlowStartParams,
    V2FlowRequestChallengeParams,
    V2FlowSubmitCodeParams,
    V2FlowResendCodeParams,
    V2FlowSubmitPasswordParams,
    V2FlowSignInWithContinuationParams,
} from "./parameter/V2FlowParams.js";
import {
    createV2FlowMethodSelectionRequiredResult,
    createV2FlowCodeRequiredResult,
    createV2FlowPasswordRequiredResult,
    createV2FlowSignInContinuationRequiredResult,
    createV2FlowCompletedResult,
} from "./result/V2FlowActionResult.js";
import type {
    V2FlowMethodSelectionRequiredResult,
    V2FlowCodeRequiredResult,
    V2FlowPasswordRequiredResult,
    V2FlowSignInContinuationRequiredResult,
    V2FlowCompletedResult,
} from "./result/V2FlowActionResult.js";
import { BrowserConfiguration } from "../../../../config/Configuration.js";
import { BrowserCacheManager } from "../../../../cache/BrowserCacheManager.js";
import { EventHandler } from "../../../../event/EventHandler.js";
import { INavigationClient } from "../../../../navigation/INavigationClient.js";
import { CustomAuthAuthority } from "../../CustomAuthAuthority.js";
import { CustomAuthV2ApiClient } from "../../network_client/custom_auth_api/v2/CustomAuthV2ApiClient.js";
import { CustomAuthV2ApiError } from "../../network_client/custom_auth_api/v2/error/CustomAuthV2ApiError.js";
import {
    CONTINUATION_LINK_MISSING,
    INVALID_HAL_RESPONSE,
    RESET_PASSWORD_TIMEOUT,
    UNSUPPORTED_FLOW_STEP,
} from "../../network_client/custom_auth_api/v2/error/V2ErrorCodes.js";
import { CustomAuthV2FlowScenario } from "../../auth_flow/v2/CustomAuthV2FlowScenario.js";
import * as PublicApiId from "../../telemetry/PublicApiId.js";

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
 * and HAL links. Results use the shared `V2FlowActionResult` envelope.
 */
export class V2FlowInteractionClient extends V2InteractionClientBase {
    constructor(
        config: BrowserConfiguration,
        storageImpl: BrowserCacheManager,
        browserCrypto: ICrypto,
        logger: Logger,
        eventHandler: EventHandler,
        navigationClient: INavigationClient,
        performanceClient: IPerformanceClient,
        customAuthAuthority: CustomAuthAuthority,
        protected apiClient: CustomAuthV2ApiClient
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
     * Starts password reset and returns the available authentication methods.
     * The selected method can then be challenged through `requestChallenge`.
     */
    async resetPassword(
        parameters: V2FlowStartParams
    ): Promise<V2FlowMethodSelectionRequiredResult> {
        const correlationId = parameters.correlationId;
        const context = this.createRequestContext(
            PublicApiId.RESET_PASSWORD_V2_START,
            correlationId
        );

        this.logger.verbose(
            "Starting V2 self-service password reset.",
            correlationId
        );

        const startResult = await this.apiClient.resetPasswordStart(
            parameters.username,
            context
        );

        this.logger.verbose(
            "V2 self-service password reset method selection required.",
            correlationId
        );

        return createV2FlowMethodSelectionRequiredResult({
            correlationId,
            continuationState: {
                continuationToken: startResult.continuationToken,
                scenario: CustomAuthV2FlowScenario.PasswordReset,
                links: {},
            },
            methods: startResult.methods.map((method) => ({
                id: method.id,
                type: method.type ?? "",
                hint: method.hint,
                challengeHref: method.challengeHref,
            })),
        });
    }

    /*
     * Requests a one-time code for the selected authentication method. Returns
     * the continuation state and code metadata needed for verification.
     */
    async requestChallenge(
        parameters: V2FlowRequestChallengeParams
    ): Promise<V2FlowCodeRequiredResult> {
        const continuationState = parameters.continuationState;
        const correlationId = parameters.correlationId;
        const context = this.createRequestContext(
            this.resolveStepApiId(
                continuationState.scenario,
                "requestChallenge",
                correlationId
            ),
            correlationId
        );

        this.logger.verbose("Requesting V2 challenge.", correlationId);

        const challengeResult = await this.apiClient.requestChallenge(
            this.requireLink(correlationId, continuationState.links.challenge),
            { continuationToken: continuationState.continuationToken },
            context
        );

        return createV2FlowCodeRequiredResult({
            correlationId,
            continuationState: {
                continuationToken: challengeResult.continuationToken,
                scenario: continuationState.scenario,
                links: {
                    verify: challengeResult.verifyHref,
                    resend: challengeResult.resendHref,
                },
            },
            channel: challengeResult.channel,
            sentTo: challengeResult.hint,
            codeLength: challengeResult.codeLength,
        });
    }

    /*
     * Verifies the submitted one-time code using the server-provided link. The
     * response determines the next required action.
     */
    async submitCode(
        parameters: V2FlowSubmitCodeParams
    ): Promise<V2FlowPasswordRequiredResult> {
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

        const verifyResult = await this.apiClient.verifyCode(
            this.requireLink(correlationId, continuationState.links.verify),
            {
                continuationToken: continuationState.continuationToken,
                otp: parameters.code,
            },
            context
        );

        switch (verifyResult.nextAction) {
            case "update":
                return createV2FlowPasswordRequiredResult({
                    correlationId,
                    continuationState: {
                        continuationToken: verifyResult.continuationToken,
                        scenario: continuationState.scenario,
                        links: { update: verifyResult.updateHref },
                    },
                });
            default:
                /*
                 * `continue` (redeem-for-tokens) is only produced by sign-in's verify, which is not
                 * wired yet; SSPR's verify always yields `update`. Guard so an unexpected outcome is
                 * a clear failure rather than a silent wrong state.
                 */
                throw new CustomAuthV2ApiError(
                    INVALID_HAL_RESPONSE,
                    `Unexpected verify outcome '${verifyResult.nextAction}' for the current flow.`,
                    { correlationId }
                );
        }
    }

    /*
     * Requests a new one-time code using the server-provided resend link.
     * Returns refreshed continuation state and code metadata.
     */
    async resendCode(
        parameters: V2FlowResendCodeParams
    ): Promise<V2FlowCodeRequiredResult> {
        const continuationState = parameters.continuationState;
        const correlationId = parameters.correlationId;
        const context = this.createRequestContext(
            this.resolveStepApiId(
                continuationState.scenario,
                "resendCode",
                correlationId
            ),
            correlationId
        );

        this.logger.verbose("Resending V2 one-time code.", correlationId);

        const challengeResult = await this.apiClient.requestChallenge(
            this.requireLink(correlationId, continuationState.links.resend),
            { continuationToken: continuationState.continuationToken },
            context
        );

        return createV2FlowCodeRequiredResult({
            correlationId,
            continuationState: {
                continuationToken: challengeResult.continuationToken,
                scenario: continuationState.scenario,
                links: {
                    verify: challengeResult.verifyHref,
                    resend: challengeResult.resendHref,
                },
            },
            channel: challengeResult.channel,
            sentTo: challengeResult.hint,
            codeLength: challengeResult.codeLength,
        });
    }

    /*
     * Submits the new password and polls until the reset completes. The result
     * contains the continuation state required for explicit sign-in.
     */
    async submitPassword(
        parameters: V2FlowSubmitPasswordParams
    ): Promise<V2FlowSignInContinuationRequiredResult> {
        const continuationState = parameters.continuationState;
        const correlationId = parameters.correlationId;
        const context = this.createRequestContext(
            this.resolveStepApiId(
                continuationState.scenario,
                "submitPassword",
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
            throw new CustomAuthV2ApiError(
                RESET_PASSWORD_TIMEOUT,
                "The password reset did not complete within the allotted number of polling attempts.",
                { correlationId }
            );
        }

        this.logger.verbose(
            "V2 password reset applied; sign-in required.",
            correlationId
        );

        return createV2FlowSignInContinuationRequiredResult({
            correlationId,
            continuationState: {
                continuationToken: completionToken,
                scenario: continuationState.scenario,
                links: { continue: continueHref },
            },
        });
    }

    /*
     * Redeems the completed flow continuation for tokens. Returns the
     * authentication result after validating and caching the response.
     */
    async signInWithContinuation(
        parameters: V2FlowSignInWithContinuationParams
    ): Promise<V2FlowCompletedResult> {
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
            continuationState.continuationToken,
            scopes,
            context,
            parameters.claims
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

        return createV2FlowCompletedResult({
            correlationId,
            authenticationResult,
        });
    }

    private resolveStepApiId(
        scenario: CustomAuthV2FlowScenario,
        step: PublicApiId.V2FlowStep,
        correlationId: string
    ): number {
        const apiId = PublicApiId.V2_FLOW_STEP_API_IDS[scenario]?.[step];

        if (apiId === undefined) {
            throw new CustomAuthV2ApiError(
                UNSUPPORTED_FLOW_STEP,
                `No telemetry API id is registered for step '${step}' of the '${scenario}' flow.`,
                { correlationId }
            );
        }

        return apiId;
    }

    private requireLink(
        correlationId: string,
        href: string | undefined
    ): string {
        if (!href) {
            throw new CustomAuthV2ApiError(
                CONTINUATION_LINK_MISSING,
                "The continuation state is missing a link required to advance the flow.",
                { correlationId }
            );
        }

        return href;
    }
}
