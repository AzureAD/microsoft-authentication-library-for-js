/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthError } from "@azure/msal-browser";
import { CustomAuthError } from "../error/CustomAuthError.js";
import { MsalCustomAuthError } from "../error/MsalCustomAuthError.js";
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
     * Creates a CustomAuthError with an error.
     * @param error - The error that occurred.
     * @returns The auth error.
     */
    protected static createErrorData(error: unknown): CustomAuthError {
        if (error instanceof CustomAuthError) {
            return error;
        } else if (error instanceof AuthError) {
            const errorCode = error.errorCode;
            const errorMessage = error.subError ? `${error.errorMessage} - ${error.subError}` : error.errorMessage;
            return new MsalCustomAuthError(errorCode, errorMessage, error.correlationId);
        } else {
            return new UnexpectedError(error);
        }
    }
}
