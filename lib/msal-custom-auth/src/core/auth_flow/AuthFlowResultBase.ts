/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { CustomAuthError } from "../error/CustomAuthError.js";
import { UnexpectedError } from "../error/UnexpectedError.js";
import { AuthFlowErrorBase } from "./AuthFlowErrorBase.js";
import { AuthFlowStateBase } from "./AuthFlowStateBase.js";

/*
 * Base class for a result of an authentication operation.
 * @typeParam TState - The type of the result data.
 * @typeParam TStateHandler - The type of state handler.
 */
export abstract class AuthFlowResultBase<
    TState extends AuthFlowStateBase,
    TError extends AuthFlowErrorBase,
    TData = void,
> {
    /*
     *constructor for ResultBase
     * @param state - The state.
     * @param data - The result data.
     */
    constructor(
        public state?: TState,
        public data?: TData,
    ) {}

    /*
     * The error that occurred during the authentication operation.
     */
    error?: TError;

    /*
     * Creates a result with an error.
     * @param error - The error that occurred.
     * @returns The result.
     */
    static createWithError<
        TData,
        TState extends AuthFlowStateBase,
        TError extends AuthFlowErrorBase,
        TActionResult extends AuthFlowResultBase<TState, TError, TData>,
    >(
        this: new () => TActionResult,
        error: unknown,
        errorConstructor: new (errorData: CustomAuthError) => TError,
    ): TActionResult {
        let customAuthError: CustomAuthError;

        if (error instanceof CustomAuthError) {
            customAuthError = error;
        } else {
            customAuthError = new UnexpectedError(error);
        }

        const errorResult = new this();

        errorResult.error = new errorConstructor(customAuthError);
        return errorResult;
    }
}
