/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase } from "../../../core/auth_flow/AuthFlowState.js";
import { SignInStateParameters } from "./SignInStateParameters.js";

/**
 * Represents the state of a sign-in operation that has been completed successfully.
 */
export class SignInCompletedState extends AuthFlowStateBase {
    protected readonly stateParameters: SignInStateParameters;

    /**
     * Creates a new instance of SignInCompletedState.
     * @param stateParameters The parameters for the completed sign-in state.
     */
    constructor(stateParameters: SignInStateParameters) {
        super();
        this.stateParameters = stateParameters;

        // Validate required parameters
        if (!stateParameters.signInClient) {
            throw new Error("signInClient is required for SignInCompletedState");
        }
    }

    /**
     * Gets the username associated with the completed sign-in.
     * @returns {string} The username.
     */
    getUsername(): string {
        return this.stateParameters.username;
    }

    /**
     * Gets the continuation token associated with the completed sign-in.
     * @returns {string} The continuation token.
     */
    getContinuationToken(): string {
        return this.stateParameters.continuationToken ?? "";
    }

    /**
     * Gets the client that can be used to perform further sign-in operations.
     * @returns {SignInClient} The sign-in client.
     */
    getSignInClient(): any {
        return this.stateParameters.signInClient;
    }
}
