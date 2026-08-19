/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase } from "../AuthFlowState.js";
import { FailedState } from "./state/FailedState.js";
import { AuthFlowErrorV2Base } from "./error/AuthFlowErrorV2Base.js";
import { CustomAuthV2FlowScenario } from "./CustomAuthV2FlowScenario.js";

/**
 * Result of a native auth V2 operation. Use {@link CustomAuthV2Result.isState}
 * to narrow the state before accessing its members.
 */
export class CustomAuthV2Result<
    TState extends AuthFlowStateBase,
    TError extends AuthFlowErrorV2Base,
    TData = void
> {
    constructor(
        public readonly state: TState,
        public readonly data?: TData,
        public readonly scenario: CustomAuthV2FlowScenario = CustomAuthV2FlowScenario.Unknown
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
     * Creates a failed result for the supplied error. The result uses the shared
     * {@link FailedState} terminal state.
     * @param error - The flow-specific error that occurred.
     * @returns A failed result carrying the given error.
     */
    static createWithError<
        TState extends AuthFlowStateBase,
        TError extends AuthFlowErrorV2Base,
        TData = void
    >(error: TError): CustomAuthV2Result<TState | FailedState, TError, TData> {
        const result = new CustomAuthV2Result<
            TState | FailedState,
            TError,
            TData
        >(new FailedState(), undefined, error.scenario);
        result.error = error;
        return result;
    }
}
