/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import { AuthenticationMethodV2 } from "../AuthenticationMethodV2.js";
import { InvalidArgumentError } from "../../../error/InvalidArgumentError.js";
import { CustomAuthV2Result } from "../CustomAuthV2Result.js";
import { RequestChallengeError } from "../error/RequestChallengeError.js";
import { toV2Error } from "./V2StateErrorHelper.js";
import { ChallengeVerificationRequiredState } from "./ChallengeVerificationRequiredState.js";
import type { V2FlowMethod } from "../../../interaction_client/v2/result/V2FlowActionResult.js";
import type { AuthenticationMethodSelectionRequiredStateParameters } from "./CustomAuthV2StateParameters.js";
import type { RequestChallengeResult } from "../result/RequestChallengeResult.js";

/**
 * State returned when the user must select one of several authentication
 * methods before a challenge can be issued. It exposes the list of offered
 * methods and lets the app request a challenge for the chosen one. The flow
 * stays on this state until a challenge is successfully requested.
 */
export class AuthenticationMethodSelectionRequiredState extends AuthFlowActionRequiredStateBase<AuthenticationMethodSelectionRequiredStateParameters> {
    readonly stateType = "authenticationMethodSelectionRequired";

    readonly methods: readonly AuthenticationMethodV2[];

    constructor(
        stateParameters: AuthenticationMethodSelectionRequiredStateParameters
    ) {
        super(stateParameters);
        this.methods = stateParameters.methods.map((method) =>
            this.toPublicMethod(method)
        );
    }

    /**
     * Requests a challenge for the selected authentication method, causing the
     * server to deliver a one-time code to that method's destination (for example
     * by email). On success the flow advances to a challenge-verification state
     * where the code can be submitted.
     * @param methodId - The id of the method to challenge, from {@link methods}.
     * @returns The result of requesting the challenge.
     */
    async requestChallenge(methodId: string): Promise<RequestChallengeResult> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            const method = this.stateParameters.methods.find(
                (candidate) => candidate.id === methodId
            );

            if (!method) {
                throw new InvalidArgumentError("methodId", correlationId);
            }

            logger.verbose(
                "Requesting challenge for the selected V2 method.",
                correlationId
            );

            const result = await flowClient.requestChallenge({
                correlationId,
                continuationState,
                challengeHref: method.challengeHref,
            });

            return new CustomAuthV2Result(
                new ChallengeVerificationRequiredState({
                    correlationId: result.correlationId,
                    logger,
                    config: this.stateParameters.config,
                    flowClient,
                    continuationState: result.continuationState,
                    cacheClient: this.stateParameters.cacheClient,
                    method: this.toPublicMethod(method),
                    sentTo: result.sentTo,
                    channel: result.channel,
                    codeLength: result.codeLength,
                }),
                undefined,
                result.continuationState.scenario
            );
        } catch (error) {
            logger.errorPii(
                `Failed to request V2 challenge. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthV2Result.createWithError(
                new RequestChallengeError(
                    toV2Error(error, correlationId),
                    continuationState.scenario
                )
            );
        }
    }

    private toPublicMethod(method: V2FlowMethod): AuthenticationMethodV2 {
        return {
            id: method.id,
            type: method.type ?? "",
            hint: method.hint,
        };
    }
}
