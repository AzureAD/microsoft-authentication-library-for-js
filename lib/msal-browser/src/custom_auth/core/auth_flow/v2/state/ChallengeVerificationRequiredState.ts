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
 * submitting a one-time code sent to their email. It carries metadata about the
 * challenge (where it was sent and the expected code length) and lets the app
 * submit the code or request a fresh one. Verifying the code advances the flow
 * to its next required step.
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
     * returned result advances the flow to its next required step; on failure the
     * result's error reports whether the code was invalid so the app can prompt
     * for re-entry.
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
     * Requests a new challenge, for example to resend the code when the user did
     * not receive it or it expired. The returned result keeps the flow on a
     * challenge-verification state with a freshly issued code.
     * @returns The result of requesting a new challenge.
     */
    requestNewChallenge(): Promise<RequestChallengeResult> {
        throw new MethodNotImplementedError(
            "ChallengeVerificationRequiredState.requestNewChallenge"
        );
    }
}
