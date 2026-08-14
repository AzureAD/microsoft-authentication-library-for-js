/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase } from "./AuthFlowState.js";
import { FailedState } from "./v2/state/FailedState.js";
import { AuthFlowErrorV2Base } from "./v2/error/AuthFlowErrorV2Base.js";
import { CustomAuthV2FlowScenario } from "./CustomAuthV2FlowScenario.js";

/**
 * Result of a native auth V2 operation, shared by every V2 flow. Each flow
 * supplies its own state union, error type, and optional data payload via a
 * result alias. Use {@link CustomAuthV2Result.isState} to narrow to a specific
 * state before accessing its members.
 */
export class CustomAuthV2Result<
    TState extends AuthFlowStateBase,
    TError extends AuthFlowErrorV2Base,
    TData = void
> {
    constructor(
        public state: TState,
        public data?: TData,
        public readonly scenario: CustomAuthV2FlowScenario = CustomAuthV2FlowScenario.Unknown
    ) {}

    error?: TError;

    /**
     * Narrows the result to a specific state by its `stateType` discriminator.
     * When it returns true it also type-guards `state` to the matching member of
     * the union, so the state's own properties and action methods become
     * accessible without a cast.
     * @param stateType - The state type to test for.
     * @returns True (and narrows `state`) when the current state matches `stateType`.
     */
    isState<TType extends TState["stateType"]>(
        stateType: TType
    ): this is this & { state: Extract<TState, { stateType: TType }> } {
        return this.state.stateType === stateType;
    }

    /**
     * Checks whether the result is in the terminal failed state. When it returns
     * true the `error` payload carries the flow-specific failure detail, and the
     * flow cannot be continued. Use it as the first branch when handling a result.
     * @returns True (and narrows `state`) when the operation failed.
     */
    isFailed(): this is this & {
        state: Extract<TState, { stateType: "failed" }>;
    } {
        return this.state.stateType === "failed";
    }

    /**
     * Builds a failed result carrying the given flow-specific error. The result's
     * state is set to the shared {@link FailedState} terminal marker and the error
     * detail is exposed via the result's `error` payload. Callers construct the
     * concrete {@link AuthFlowErrorV2Base} subclass so the result surfaces only
     * that action's detectors.
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
