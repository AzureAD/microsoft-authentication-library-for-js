/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowActionRequiredStateBase } from "../../AuthFlowState.js";
import { AuthenticationMethodV2 } from "../AuthenticationMethodV2.js";
import { MethodNotImplementedError } from "../../../error/MethodNotImplementedError.js";
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
        this.methods = stateParameters.methods;
    }

    /**
     * Requests a challenge for the selected authentication method, causing the
     * server to deliver a one-time code (for example by email). On success the
     * returned result advances the flow to a challenge-verification state where
     * the code can be submitted.
     * @param methodId - The id of the method to challenge, from {@link methods}.
     * @param verificationContact - Optional destination override for the challenge.
     * @returns The result of requesting the challenge.
     */
    async requestChallenge(
        methodId: string,
        verificationContact?: string
    ): Promise<RequestChallengeResult> {
        void methodId;
        void verificationContact;
        throw new MethodNotImplementedError(
            "AuthenticationMethodSelectionRequiredState.requestChallenge"
        );
    }
}
