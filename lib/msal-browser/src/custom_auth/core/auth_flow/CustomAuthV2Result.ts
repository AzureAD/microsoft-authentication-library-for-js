/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowResultBase } from "./AuthFlowResultBase.js";
import { AuthFlowErrorBase } from "./AuthFlowErrorBase.js";
import { AuthFlowStateBase } from "./AuthFlowState.js";
import { FailedState } from "./v2/state/FailedState.js";
import { CustomAuthV2Error } from "./v2/error/CustomAuthV2Error.js";
import { CustomAuthV2FlowScenario } from "./CustomAuthV2FlowScenario.js";

/**
 * Result of a native auth V2 operation.
 *
 * A single generic result type is shared by every V2 flow; each flow supplies
 * its own state union (TState) and error type (TError) via a result alias. Use
 * {@link CustomAuthV2Result.isState} to narrow to a specific state before
 * accessing its members.
 *
 * All V2 states extend `AuthFlowStateBase` and carry a `stateType`
 * discriminator, so `TState` is bound to it. Each flow narrows the union via a
 * result alias.
 *
 * @typeParam TState - The union of states this result can carry.
 * @typeParam TError - The error type raised for this operation.
 * @typeParam TData - The optional data payload attached to the result.
 */
export class CustomAuthV2Result<
    TState extends AuthFlowStateBase,
    TError extends AuthFlowErrorBase,
    TData = void
> extends AuthFlowResultBase<TState, TError, TData> {
    /**
     * Narrows the result to a specific state by its `stateType` discriminator.
     * @param stateType - The state type to test for.
     * @returns True (and narrows `state`) when the current state matches `stateType`.
     */
    isState<TType extends TState["stateType"]>(
        stateType: TType
    ): this is this & { state: Extract<TState, { stateType: TType }> } {
        return this.state.stateType === stateType;
    }

    /**
     * Checks whether the result is in the failed state.
     * @returns True (and narrows `state`) when the operation failed.
     */
    isFailed(): this is this & {
        state: Extract<TState, { stateType: "failed" }>;
    } {
        return this.state.stateType === "failed";
    }

    /**
     * Builds a failed result carrying a unified {@link CustomAuthV2Error}.
     *
     * The result's state is set to the shared {@link FailedState} terminal
     * marker; the error detail is exposed via the result's `error` payload.
     * @param error - The error that occurred.
     * @param scenario - The V2 flow the error originated from. Defaults to "unknown".
     * @returns A failed result for the given flow.
     */
    static createWithError<TState extends AuthFlowStateBase, TData = void>(
        error: unknown,
        scenario: CustomAuthV2FlowScenario = "unknown"
    ): CustomAuthV2Result<TState, CustomAuthV2Error, TData> {
        const result = new CustomAuthV2Result<
            TState,
            CustomAuthV2Error,
            TData
        >(new FailedState() as unknown as TState);
        result.error = new CustomAuthV2Error(
            CustomAuthV2Result.createErrorData(error),
            scenario
        );
        return result;
    }
}
