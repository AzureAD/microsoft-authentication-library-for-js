/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "../../AuthFlowResultBase.js";
import { MfaGetAuthMethodsError } from "../error_type/MfaError.js";
import { MfaFailedState } from "../state/MfaFailedState.js";
import type { MfaMethodSelectionRequiredState } from "../state/MfaState.js";

/**
 * Result of getting available authentication methods.
 */
export class MfaGetAuthMethodsResult extends AuthFlowResultBase<
    MfaGetAuthMethodsResultState,
    MfaGetAuthMethodsError
> {
    /**
     * Creates an MfaGetAuthMethodsResult with an error.
     * @param error The error that occurred.
     * @returns The MfaGetAuthMethodsResult with error.
     */
    static createWithError(error: unknown): MfaGetAuthMethodsResult {
        const result = new MfaGetAuthMethodsResult(new MfaFailedState());
        result.error = new MfaGetAuthMethodsError(
            MfaGetAuthMethodsResult.createErrorData(error)
        );
        return result;
    }

    /**
     * Checks if the result indicates that method selection is required.
     * @returns true if method selection is required, false otherwise.
     */
    isMethodSelectionRequired(): boolean {
        return (
            this.state.constructor?.name === "MfaMethodSelectionRequiredState"
        );
    }

    /**
     * Checks if the result is in a failed state.
     * @returns true if the result is failed, false otherwise.
     */
    isFailed(): boolean {
        return this.state instanceof MfaFailedState;
    }
}

export type MfaGetAuthMethodsResultState =
    | MfaMethodSelectionRequiredState
    | MfaFailedState;
