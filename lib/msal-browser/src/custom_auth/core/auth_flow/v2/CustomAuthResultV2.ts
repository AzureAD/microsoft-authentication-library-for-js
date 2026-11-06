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
import { AuthFlowErrorV2 } from "./error/AuthFlowErrorV2.js";
import type { AuthFlowErrorContextV2 } from "./error/AuthFlowErrorV2.js";
import { CustomAuthFlowScenarioV2 } from "./CustomAuthFlowScenarioV2.js";

type CreateWithErrorOptions = {
    scenario?: CustomAuthFlowScenarioV2;
    correlationId?: string;
    errorContext?: AuthFlowErrorContextV2;
};

/**
 * Result of a native auth V2 operation.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export class CustomAuthResultV2<
    TState extends AuthFlowStateBase,
    TData = void
> {
    constructor(
        public readonly state: TState,
        public readonly data?: TData,
        public readonly scenario: CustomAuthFlowScenarioV2 = CustomAuthFlowScenarioV2.Unknown
    ) {}

    error?: AuthFlowErrorV2;

    /**
     * Checks whether the result matches a state type and narrows its state.
     * @param stateType - The state type to test for.
     * @returns True (and narrows `state`) when the current state matches `stateType`.
     */
    isState<TType extends TState["stateType"]>(
        stateType: TType
    ): this is this & { state: Extract<TState, { stateType: TType }> } {
        return this.state.stateType === stateType;
    }

    /**
     * Checks whether the operation failed.
     * @returns True (and narrows `state`) when the operation failed.
     */
    isFailed(): this is this & {
        state: Extract<TState, { stateType: "failed" }>;
    } {
        return this.state.stateType === "failed";
    }

    /**
     * Checks whether the current state requires a password.
     * @returns True (and narrows `state`) when a password is required.
     */
    isPasswordRequired(): this is this & {
        state: Extract<TState, { stateType: "passwordRequired" }>;
    } {
        return this.state.stateType === "passwordRequired";
    }

    /**
     * Creates a failed result from the supplied error.
     * Optional error context identifies MFA verification or authentication-method registration.
     * @param error - The error that occurred.
     * @param options - The flow-error context.
     * @returns A failed result carrying the unified V2 flow error.
     */
    static createWithError<TState extends AuthFlowStateBase, TData = void>(
        error: unknown,
        options: CreateWithErrorOptions
    ): CustomAuthResultV2<TState | FailedStateV2, TData> {
        const { correlationId } = options;
        const flowError =
            error instanceof AuthFlowErrorV2
                ? error
                : new AuthFlowErrorV2(
                      CustomAuthResultV2.createErrorData(error, correlationId),
                      options.scenario ?? CustomAuthFlowScenarioV2.Unknown,
                      options.errorContext
                  );

        const result = new CustomAuthResultV2<TState | FailedStateV2, TData>(
            new FailedStateV2(),
            undefined,
            flowError.scenario
        );
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
