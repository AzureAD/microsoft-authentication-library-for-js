/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthError } from "../error/CustomAuthError.js";
import { UnexpectedError } from "../error/UnexpectedError.js";
import { AuthFlowErrorBase } from "./AuthFlowErrorBase.js";
import { AuthFlowStateHandlerBase } from "./AuthFlowStateHandlerBase.js";

/*
 * Base class for a result of an authentication operation.
 * @typeParam TState - The type of the result data.
 * @typeParam TStateHandler - The type of state handler.
 */
export abstract class ResultBase<
    TState,
    TError extends AuthFlowErrorBase,
    TData = void,
    TStateHandler extends AuthFlowStateHandlerBase | void = void
> {
    /*
     * The state of the authentication operation.
     */
    protected _state?: TState;

    /*
     *constructor for ResultBase
     * @param data - The result data.
     * @param state - The state.
     * @typeParam TData - The type of the result data.
     * @typeParam TState - The type of state.
     */
    constructor(public data?: TData, public stateHandler?: TStateHandler) {}

    /*
     * The error that occurred during the authentication operation.
     */
    error?: TError;

    /*
     * Gets current state of the authentication operation.
     */
    abstract get state(): TState;

    /*
     * Creates a result with an error.
     * @param error - The error that occurred.
     * @returns The result.
     * @typeParam TData - The type of the result data.
     * @typeParam TState - The type of state.
     * @typeParam TActionResult - The type of the result.
     */
    static createWithError<
        TData,
        TStateHandler extends AuthFlowStateHandlerBase | void,
        TState,
        TError extends AuthFlowErrorBase,
        TActionResult extends ResultBase<TState, TError, TData, TStateHandler>
    >(this: new () => TActionResult, error: unknown): TActionResult {
        let customAuthError: CustomAuthError;

        if (error instanceof CustomAuthError) {
            customAuthError = error;
        } else {
            customAuthError = new UnexpectedError(error);
        }

        const errorResult = new this();
        errorResult.error = {
            error: customAuthError,
        } as TError;
        return errorResult;
    }
}
