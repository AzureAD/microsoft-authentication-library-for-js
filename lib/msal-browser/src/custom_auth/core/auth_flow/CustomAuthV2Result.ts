/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowStateBase } from "./AuthFlowState.js";
import { FailedState } from "./v2/state/FailedState.js";
import { AuthFlowErrorV2Base } from "./v2/error/AuthFlowErrorV2Base.js";

/**
 * Result of a native auth V2 operation.
 *
 * A single generic result type is shared by every V2 flow; each flow supplies
 * its own state union (TState) and error type (TError) via a result alias. Use
 * {@link CustomAuthV2Result.isState} to narrow to a specific state before
 * accessing its members.
 *
 * V2 results are intentionally decoupled from the V1 `AuthFlowResultBase`: their
 * error type is bound to the standalone {@link AuthFlowErrorV2Base} hierarchy
 * (whose payload uses the V2 wire-error format), not the V1
 * `AuthFlowErrorBase`/`CustomAuthError` model.
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
    TError extends AuthFlowErrorV2Base,
    TData = void
> {
    /**
     * constructor for CustomAuthV2Result
     * @param state - The current state of the operation.
     * @param data - The optional data payload attached to the result.
     */
    constructor(public state: TState, public data?: TData) {}

    /**
     * The error that occurred during the authentication operation.
     */
    error?: TError;

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
     * Builds a failed result carrying the given flow-specific error.
     *
     * The result's state is set to the shared {@link FailedState} terminal
     * marker; the error detail is exposed via the result's `error` payload.
     * Callers construct the concrete {@link AuthFlowErrorV2Base} subclass for
     * the action (for example `ResetPasswordV2Error`) so the returned result
     * surfaces only that action's detectors.
     * @param error - The flow-specific error that occurred.
     * @returns A failed result carrying the given error.
     */
    static createWithError<
        TState extends AuthFlowStateBase,
        TError extends AuthFlowErrorV2Base,
        TData = void
    >(error: TError): CustomAuthV2Result<TState, TError, TData> {
        const result = new CustomAuthV2Result<TState, TError, TData>(
            new FailedState() as unknown as TState
        );
        result.error = error;
        return result;
    }
}
