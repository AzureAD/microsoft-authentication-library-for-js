/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import { AuthenticationMethodV2 } from "../AuthenticationMethodV2.js";
import { CustomAuthV2Result } from "../CustomAuthV2Result.js";
import { VerifyChallengeError } from "../error/VerifyChallengeError.js";
import { RequestChallengeError } from "../error/RequestChallengeError.js";
import { toV2Error } from "./V2StateErrorHelper.js";
import { NewPasswordRequiredState } from "./NewPasswordRequiredState.js";
import type { ChallengeVerificationRequiredStateParameters } from "./CustomAuthV2StateParameters.js";
import type { VerifyChallengeResult } from "../result/VerifyChallengeResult.js";
import type { RequestChallengeResult } from "../result/RequestChallengeResult.js";

/**
 * State returned when the user must verify a challenge, for example by
 * submitting a one-time code sent to their email. It carries metadata about the
 * challenge and lets the app submit the code or request a fresh one.
 */
export class ChallengeVerificationRequiredState extends AuthFlowActionRequiredStateBase<ChallengeVerificationRequiredStateParameters> {
    readonly stateType = "challengeVerificationRequired";

    readonly method: AuthenticationMethodV2;

    readonly sentTo?: string;

    readonly channel?: string;

    readonly codeLength?: number;

    constructor(stateParameters: ChallengeVerificationRequiredStateParameters) {
        super(stateParameters);
        this.method = stateParameters.method;
        this.sentTo = stateParameters.sentTo;
        this.channel = stateParameters.channel;
        this.codeLength = stateParameters.codeLength;
    }

    /**
     * Verifies the challenge with the code the user received. On success the
     * result requests the next required action; failures identify invalid codes.
     * @param code - The code to verify.
     * @returns The result of verifying the challenge.
     */
    async verifyChallenge(code: string): Promise<VerifyChallengeResult> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            if (this.stateParameters.codeLength) {
                this.ensureCodeIsValid(code, this.stateParameters.codeLength);
            }

            logger.verbose("Verifying V2 challenge code.", correlationId);

            const result = await flowClient.submitCode({
                correlationId,
                continuationState,
                code,
            });

            return new CustomAuthV2Result(
                new NewPasswordRequiredState({
                    correlationId: result.correlationId,
                    logger,
                    config: this.stateParameters.config,
                    flowClient,
                    continuationState: result.continuationState,
                    cacheClient: this.stateParameters.cacheClient,
                }),
                undefined,
                result.continuationState.scenario
            );
        } catch (error) {
            logger.errorPii(
                `Failed to verify V2 challenge. Error: '${error}'.`,
                correlationId
            );

            return CustomAuthV2Result.createWithError(
                new VerifyChallengeError(
                    toV2Error(error, correlationId),
                    continuationState.scenario
                )
            );
        }
    }

    /**
     * Requests a new challenge when the previous code was not received or expired.
     * The returned result contains the newly issued challenge details.
     * @returns The result of requesting a new challenge.
     */
    async requestNewChallenge(): Promise<RequestChallengeResult> {
        const { correlationId, logger, continuationState, flowClient } =
            this.stateParameters;

        try {
            logger.verbose("Resending V2 challenge code.", correlationId);

            const result = await flowClient.resendCode({
                correlationId,
                continuationState,
            });

            return new CustomAuthV2Result(
                new ChallengeVerificationRequiredState({
                    correlationId: result.correlationId,
                    logger,
                    config: this.stateParameters.config,
                    flowClient,
                    continuationState: result.continuationState,
                    cacheClient: this.stateParameters.cacheClient,
                    method: this.method,
                    sentTo: result.sentTo,
                    channel: result.channel,
                    codeLength: result.codeLength,
                }),
                undefined,
                result.continuationState.scenario
            );
        } catch (error) {
            logger.errorPii(
                `Failed to resend V2 challenge. Error: '${error}'.`,
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
}
