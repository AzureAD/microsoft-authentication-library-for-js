/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SignInCodeRequired } from "../../sign_in/auth_flow/state/SignInCodeRequired.js";
import { SignInPasswordRequired } from "../../sign_in/auth_flow/state/SignInPasswordRequired.js";
import { SignInCodeRequiredStateHandler } from "../../sign_in/auth_flow/state_handler/SignInCodeRequiredStateHandler.js";
import { SignInContinuationStateHandler } from "../../sign_in/auth_flow/state_handler/SignInContinuationStateHandler.js";
import { SignInPasswordRequiredStateHandler } from "../../sign_in/auth_flow/state_handler/SignInPasswordRequiredStateHandler.js";
import { SignUpAttributesRequired } from "../../sign_up/auth_flow/state/SignUpAttributesRequired.js";
import { SignUpCodeRequired } from "../../sign_up/auth_flow/state/SignUpCodeRequired.js";
import { SignUpCompleted } from "../../sign_up/auth_flow/state/SignUpCompleted.js";
import { SignUpPasswordRequired } from "../../sign_up/auth_flow/state/SignUpPasswordRequired.js";
import { SignUpAttributesRequiredStateHandler } from "../../sign_up/auth_flow/state_handler/SignUpAttributesRequiredStateHandler.js";
import { SignUpCodeRequiredStateHandler } from "../../sign_up/auth_flow/state_handler/SignUpCodeRequiredStateHandler.js";
import { SignUpPasswordRequiredStateHandler } from "../../sign_up/auth_flow/state_handler/SignUpPasswordRequiredStateHandler.js";
import { UnexpectedError } from "../error/UnexpectedError.js";
import { AuthFlowStateBase } from "./AuthFlowStateBase.js";
import { AuthFlowStateHandlerBase } from "./AuthFlowStateHandlerBase.js";

export class AuthFlowStateHandlerFactory {
    public static create(
        state: SignInCodeRequired,
    ): SignInCodeRequiredStateHandler;
    public static create(
        state: SignInPasswordRequired,
    ): SignInPasswordRequiredStateHandler;
    public static create(
        state: SignUpCodeRequired,
    ): SignUpCodeRequiredStateHandler;
    public static create(
        state: SignUpPasswordRequired,
    ): SignUpPasswordRequiredStateHandler;
    public static create(
        state: SignUpAttributesRequired,
    ): SignUpAttributesRequiredStateHandler;
    public static create(
        state: SignUpCompleted,
    ): SignInContinuationStateHandler;
    public static create(state: AuthFlowStateBase): AuthFlowStateHandlerBase {
        if (!state.logger) {
            throw new UnexpectedError(
                "Logger is required when creating state handler",
                state.correlationId,
            );
        }

        if (!state.config) {
            throw new UnexpectedError(
                "Configuration is required when creating state handler",
                state.correlationId,
            );
        }

        if (state instanceof SignInCodeRequired) {
            return new SignInCodeRequiredStateHandler(
                state.username,
                state.signInClient,
                state.correlationId ?? "",
                state.logger,
                state.continuationToken ?? "",
                state.config,
                state.codeLength,
                state.codeResendInterval,
                state.scope,
            );
        }

        if (state instanceof SignInPasswordRequired) {
            return new SignInPasswordRequiredStateHandler(
                state.username,
                state.signInClient,
                state.correlationId ?? "",
                state.logger,
                state.continuationToken ?? "",
                state.config,
                state.scope,
            );
        }

        if (state instanceof SignUpCodeRequired) {
            return new SignUpCodeRequiredStateHandler(
                state.username,
                state.signUpClient,
                state.signInClient,
                state.correlationId ?? "",
                state.logger,
                state.continuationToken ?? "",
                state.config,
                state.codeLength,
                state.codeResendInterval,
            );
        }

        if (state instanceof SignUpPasswordRequired) {
            return new SignUpPasswordRequiredStateHandler(
                state.username,
                state.signUpClient,
                state.signInClient,
                state.correlationId ?? "",
                state.logger,
                state.continuationToken ?? "",
                state.config,
            );
        }

        if (state instanceof SignUpAttributesRequired) {
            return new SignUpAttributesRequiredStateHandler(
                state.username,
                state.signUpClient,
                state.signInClient,
                state.correlationId ?? "",
                state.logger,
                state.continuationToken ?? "",
                state.config,
                state.requiredAttributes,
            );
        }

        if (state instanceof SignUpCompleted) {
            return new SignInContinuationStateHandler(
                state.username,
                state.signInClient,
                state.correlationId ?? "",
                state.logger,
                state.continuationToken ?? "",
                state.config,
            );
        }

        throw new UnexpectedError(
            "Unsupported state type provided when creating state handler",
            state.correlationId,
        );
    }
}
