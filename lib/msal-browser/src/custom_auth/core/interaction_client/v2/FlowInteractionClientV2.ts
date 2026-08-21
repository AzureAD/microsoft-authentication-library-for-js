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
    FlowRequestChallengeParamsV2,
    FlowSubmitCodeParamsV2,
    FlowResendCodeParamsV2,
    FlowSubmitPasswordParamsV2,
    FlowSignInWithContinuationParamsV2,
} from "./parameter/FlowParamsV2.js";
import {
    createFlowMethodSelectionRequiredResultV2,
    createFlowCodeRequiredResultV2,
    createFlowPasswordRequiredResultV2,
    createFlowSignInContinuationRequiredResultV2,
    createFlowCompletedResultV2,
} from "./result/FlowActionResultV2.js";
import type {
    FlowMethodSelectionRequiredResultV2,
    FlowCodeRequiredResultV2,
    FlowPasswordRequiredResultV2,
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
    INVALID_HAL_RESPONSE,
    RESET_PASSWORD_TIMEOUT,
    UNSUPPORTED_FLOW_STEP,
} from "../../network_client/custom_auth_api/v2/ErrorCodesV2.js";
import { CustomAuthFlowScenarioV2 } from "../../auth_flow/v2/CustomAuthFlowScenarioV2.js";
import * as PublicApiId from "../../telemetry/PublicApiId.js";
import {
    getPublicApiIdV2,
    FlowStepV2,
} from "../../telemetry/FlowApiIdHelperV2.js";

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
     * Starts password reset and returns the available authentication methods.
     * The selected method can then be challenged through `requestChallenge`.
     */
    async resetPassword(
        parameters: FlowStartParamsV2
    ): Promise<FlowMethodSelectionRequiredResultV2> {
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
            entryResult.resetPasswordHref,
            {
                username: parameters.username,
                continuationToken: entryResult.continuationToken,
            },
            context
        );

        this.logger.verbose(
            "V2 self-service password reset method selection required.",
            correlationId
        );

        return createFlowMethodSelectionRequiredResultV2({
            correlationId,
            continuationState: {
                continuationToken: startResult.continuationToken,
                scenario: CustomAuthFlowScenarioV2.PasswordReset,
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
        parameters: FlowRequestChallengeParamsV2
    ): Promise<FlowCodeRequiredResultV2> {
        return this.requestMethodChallenge(
            parameters,
            parameters.continuationState.links.challenge,
            "requestChallenge",
            "Requesting V2 challenge."
        );
    }

    /*
     * Verifies the submitted one-time code using the server-provided link. The
     * response determines the next required action.
     */
    async submitCode(
        parameters: FlowSubmitCodeParamsV2
    ): Promise<FlowPasswordRequiredResultV2> {
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

        switch (verifyResult.nextAction) {
            case "update":
                return createFlowPasswordRequiredResultV2({
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
                const message = `Unexpected verify outcome '${verifyResult.nextAction}' for the current flow.`;
                this.logger.error(message, correlationId);

                throw new CustomAuthError(
                    INVALID_HAL_RESPONSE,
                    message,
                    correlationId
                );
        }
    }

    /*
     * Requests a new one-time code using the server-provided resend link.
     * Returns refreshed continuation state and code metadata.
     */
    async resendCode(
        parameters: FlowResendCodeParamsV2
    ): Promise<FlowCodeRequiredResultV2> {
        return this.requestMethodChallenge(
            parameters,
            parameters.continuationState.links.challenge,
            "resendCode",
            "Resending V2 one-time code."
        );
    }

    private async requestMethodChallenge(
        parameters: FlowRequestChallengeParamsV2 | FlowResendCodeParamsV2,
        challengeHref: string | undefined,
        step: "requestChallenge" | "resendCode",
        logMessage: string
    ): Promise<FlowCodeRequiredResultV2> {
        const continuationState = parameters.continuationState;
        const correlationId = parameters.correlationId;
        const context = this.createRequestContext(
            this.resolveStepApiId(
                continuationState.scenario,
                step,
                correlationId
            ),
            correlationId
        );

        this.logger.verbose(logMessage, correlationId);

        const challengeResult = await this.apiClient.requestChallenge(
            this.requireLink(correlationId, challengeHref),
            { continuationToken: continuationState.continuationToken },
            context
        );

        return createFlowCodeRequiredResultV2({
            correlationId,
            continuationState: {
                continuationToken: challengeResult.continuationToken,
                scenario: continuationState.scenario,
                links: {
                    challenge: challengeHref,
                    verify: challengeResult.verifyHref,
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
        parameters: FlowSubmitPasswordParamsV2
    ): Promise<FlowSignInContinuationRequiredResultV2> {
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

        return createFlowCompletedResultV2({
            correlationId,
            authenticationResult,
        });
    }

    private resolveStepApiId(
        scenario: CustomAuthFlowScenarioV2,
        step: FlowStepV2,
        correlationId: string
    ): number {
        const apiId = getPublicApiIdV2(scenario, step);

        if (apiId === undefined) {
            throw new CustomAuthError(
                UNSUPPORTED_FLOW_STEP,
                `No telemetry API id is registered for step '${step}' of the '${scenario}' flow.`,
                correlationId
            );
        }

        return apiId;
    }

    private requireLink(
        correlationId: string,
        href: string | undefined
    ): string {
        if (!href) {
            throw new CustomAuthError(
                CONTINUATION_LINK_MISSING,
                "The continuation state is missing a link required to advance the flow.",
                correlationId
            );
        }

        return href;
    }
}
