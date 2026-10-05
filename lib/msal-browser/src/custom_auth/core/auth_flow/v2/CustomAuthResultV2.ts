/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-common/browser";
import { AuthFlowStateBase } from "../AuthFlowState.js";
import { CustomAuthError } from "../../error/CustomAuthError.js";
import { MsalCustomAuthError } from "../../error/MsalCustomAuthError.js";
import { UnexpectedError } from "../../error/UnexpectedError.js";
import { FailedStateV2 } from "./state/FailedStateV2.js";
import { AuthFlowErrorBaseV2 } from "./error/AuthFlowErrorBaseV2.js";
import { CustomAuthFlowScenarioV2 } from "./CustomAuthFlowScenarioV2.js";

type CreateWithErrorOptions<TError extends AuthFlowErrorBaseV2> = {
    errorType: new (
        errorData: CustomAuthError,
        scenario?: CustomAuthFlowScenarioV2
    ) => TError;
    scenario?: CustomAuthFlowScenarioV2;
    correlationId?: string;
};

/**
 * Result of a native auth V2 operation. Use {@link CustomAuthResultV2.isState}
 * to narrow the state before accessing its members.
 */
export class CustomAuthResultV2<
    TState extends AuthFlowStateBase,
    TError extends AuthFlowErrorBaseV2,
    TData = void
> {
    constructor(
        public readonly state: TState,
        public readonly data?: TData,
        public readonly scenario: CustomAuthFlowScenarioV2 = CustomAuthFlowScenarioV2.Unknown
    ) {}

    error?: TError;

    /**
     * Narrows the result to a specific state by its `stateType` discriminator.
     * A successful match makes the state's properties available without a cast.
     * @param stateType - The state type to test for.
     * @returns True (and narrows `state`) when the current state matches `stateType`.
     */
    isState<TType extends TState["stateType"]>(
        stateType: TType
    ): this is this & { state: Extract<TState, { stateType: TType }> } {
        return this.state.stateType === stateType;
    }

    /**
     * Checks whether the result is in the terminal failed state. A failed result
     * contains the flow-specific error.
     * @returns True (and narrows `state`) when the operation failed.
     */
    isFailed(): this is this & {
        state: Extract<TState, { stateType: "failed" }>;
    } {
        return this.state.stateType === "failed";
    }

    /**
     * Creates a failed result from the supplied error. The result uses the
     * shared {@link FailedStateV2} terminal state.
     * @param error - The error that occurred.
     * @param options - The flow-error type and error context.
     * @returns A failed result carrying the flow-specific error.
     */
    static createWithError<
        TState extends AuthFlowStateBase,
        TError extends AuthFlowErrorBaseV2,
        TData = void
    >(
        error: unknown,
        options: CreateWithErrorOptions<TError>
    ): CustomAuthResultV2<TState | FailedStateV2, TError, TData> {
        const {
            errorType: ErrorType,
            scenario = CustomAuthFlowScenarioV2.Unknown,
            correlationId,
        } = options;
        const errorData = CustomAuthResultV2.createErrorData(
            error,
            correlationId
        );
        const flowError = new ErrorType(errorData, scenario);

        const result = new CustomAuthResultV2<
            TState | FailedStateV2,
            TError,
            TData
        >(new FailedStateV2(), undefined, scenario);
        result.error = flowError;

        return result;
    }

    private static createErrorData(
        error: unknown,
        correlationId?: string
    ): CustomAuthError {
        if (error instanceof CustomAuthError) {
            return error;
        }

        if (error instanceof AuthError) {
            const errorCodes: number[] = [];

            if ("errorNo" in error) {
                if (typeof error.errorNo === "string") {
                    const code = Number(error.errorNo);
                    if (!isNaN(code)) {
                        errorCodes.push(code);
                    }
                } else if (typeof error.errorNo === "number") {
                    errorCodes.push(error.errorNo);
                }
            }

            return new MsalCustomAuthError(
                error.errorCode,
                error.errorMessage,
                error.subError,
                errorCodes,
                error.correlationId
            );
        }

        return new UnexpectedError(error, correlationId);
    }
}
