/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import { AuthenticationMethodV2 } from "../AuthenticationMethodV2.js";
import { MethodNotImplementedError } from "../../../error/MethodNotImplementedError.js";
import type { ChallengeVerificationRequiredStateParameters } from "./CustomAuthV2StateParameters.js";
import type { VerifyChallengeResult } from "../result/VerifyChallengeResult.js";
import type { RequestChallengeResult } from "../result/RequestChallengeResult.js";

/**
 * State returned when the user must verify a challenge, for example by
 * submitting a one-time code sent to their email.
 */
export class ChallengeVerificationRequiredState extends AuthFlowActionRequiredStateBase<ChallengeVerificationRequiredStateParameters> {
    readonly stateType = "challengeVerificationRequired";

    /**
     * The authentication method being challenged.
     */
    readonly method: AuthenticationMethodV2;

    /**
     * A masked description of where the challenge was sent, for example "y****@g****.com".
     */
    readonly sentTo?: string;

    /**
     * The channel the challenge was sent over, for example "email".
     */
    readonly channel?: string;

    /**
     * The expected length of the code, when the server provides it.
     */
    readonly codeLength?: number;

    constructor(stateParameters: ChallengeVerificationRequiredStateParameters) {
        super(stateParameters);
        this.method = stateParameters.method;
        this.sentTo = stateParameters.sentTo;
        this.channel = stateParameters.channel;
        this.codeLength = stateParameters.codeLength;
    }

    /**
     * Verifies the challenge with the code the user received.
     * @param code - The code to verify.
     * @returns The result of verifying the challenge.
     */
    verifyChallenge(code: string): Promise<VerifyChallengeResult> {
        void code;
        throw new MethodNotImplementedError(
            "ChallengeVerificationRequiredState.verifyChallenge"
        );
    }

    /**
     * Requests a new challenge, for example to resend the code.
     * @returns The result of requesting a new challenge.
     */
    requestNewChallenge(): Promise<RequestChallengeResult> {
        throw new MethodNotImplementedError(
            "ChallengeVerificationRequiredState.requestNewChallenge"
        );
    }
}
