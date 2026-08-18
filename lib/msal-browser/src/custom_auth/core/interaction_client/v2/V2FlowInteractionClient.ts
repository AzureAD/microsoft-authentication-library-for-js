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
 * Poll retry policy for the password-update completion check (SSPR step 6):
 * poll up to 5 times, waiting 1.5s between attempts (the first poll runs immediately). The loop
 * lives here in the interaction client because the L2 `poll` is a single-shot call by design.
 */
const POLL_MAX_ATTEMPTS = 5;
// TODO: Replace this fallback with the server-provided polling interval once available.
const POLL_INTERVAL_MS = 1500;

const delay = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

/*
 * Single, flow-agnostic interaction client that drives a server-driven Native Auth V2 flow. Rather
 * than one client per action (the original V2 plan) or per flow, one implementation walks every
 * flow step by step, translating an opaque continuation plus the user's input into the unified
 * `V2FlowActionResult` envelope by calling the V2 network client and following its HAL links.
 *
 * SSPR is the first flow wired up: the `resetPassword` entry plus the `submitCode`/`resendCode`
 * code steps are implemented; the password-submit and sign-in-after-reset steps are filled in by
 * the remaining Layer 3 task. The backing `CustomAuthV2ApiClient` is the one generic V2 network
 * client (per-flow `*Start` methods + generic href-based steps).
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
     * Reset-password entry (steps 1-2): run the authorize-challenge entry + resetpassword-start,
     * then stop so the app can pick an authentication method. This is the flow-specific entry point:
     * it stamps the SSPR scenario and telemetry id, which the generic continuation steps then read
     * back from the continuation. JS exposes the method choice to the app, so this returns a
     * `methodSelectionRequired` outcome carrying the selectable methods (each with
     * its own challenge href) plus the continuation; the challenge is sent by `requestChallenge`.
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
     * Request the challenge for the selected method (step 3). Generic across flows: POSTs the chosen
     * method's `challenge` href (resolved by the caller from the method the user picked) so the
     * one-time code is sent, then returns a `codeRequired` outcome carrying the continuation (with
     * the `verify`/`resend` hrefs) plus the OTP display metadata - the same envelope `resendCode`
     * produces. Scenario is threaded forward from the continuation.
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
            this.requireLink(
                correlationId,
                continuationState.links.challenge
            ),
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
     * Submit the one-time code (step 4 verify). Generic across flows: POSTs the OTP to the
     * continuation's `verify` href and, on success, advances to the password step. It reads the
     * href/scenario from the continuation (never from a flow-specific field) and branches on the
     * server response, not the scenario. The scenario is threaded
     * forward so a later failure is still tagged with the originating flow.
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
     * Resend the one-time code (step 3 challenge, re-run). Generic across flows: POSTs the
     * continuation's `resend` href to have a fresh code sent, then returns a `codeRequired` outcome
     * with a refreshed continuation (new `verify`/`resend` hrefs) and OTP display metadata - the
     * same envelope `resetPassword` produced. Scenario is threaded forward from the continuation.
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
     * Submit the new password (step 5 update + step 6 poll). SSPR-specific in shape but reached
     * through the generic client: PUT the password to the continuation's `update` href, then poll
     * the returned `poll` href until the server reports the reset applied (`state: continue`).
     * The update-then-poll cycle plus the bounded retry loop live here (the L2 `poll` is
     * single-shot). On completion the account is NOT auto-signed-in (matching V1); a
     * `signInContinuationRequired` outcome carries the completion token forward so the app
     * can explicitly sign in. A reset that never completes within the retry budget is surfaced as a
     * synthetic timeout error.
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
     * Signs the account in by redeeming the flow continuation for tokens.
     * Returns the completed authentication result after validating and caching
     * the token response.
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

    /*
     * Resolve the telemetry api id to report for a generic step, from the flow the continuation was
     * seeded with. The shared step methods must not hardcode a flow-specific api id (that would tie
     * them to one flow); the id is looked up per scenario so one step serves every flow. A scenario
     * with no registered id for the step is an internal wiring gap (a flow reached a step it never
     * registered) and is surfaced as a synthetic client error.
     */
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

    /*
     * Guard a step's required continuation href. The links are populated by the network layer from
     * validated server responses, so a missing one is an internal invariant violation rather than a
     * server failure; it is surfaced as a synthetic client error so it is never confused with a
     * wire error.
     */
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
