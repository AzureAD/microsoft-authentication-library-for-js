/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AuthFlowErrorBase } from "../../AuthFlowErrorBase.js";
import type { CustomAuthError } from "../../../error/CustomAuthError.js";
import type { CustomAuthV2FlowScenario } from "../../CustomAuthV2FlowScenario.js";
import type { CustomAuthV2ErrorType } from "./CustomAuthV2ErrorType.js";

/**
 * The single error type raised across all native auth V2 flows.
 *
 * Instead of per-flow error classes, one unified error carries a {@link scenario}
 * indicating which flow it came from, a classified {@link errorType} discriminator,
 * and exposes boolean `isXxx()` detectors for the specific failure. Mirrors iOS
 * `MSALNativeAuthFlowError` and Android `NativeAuthErrorV2` (which likewise stores a
 * classified error-type and compares against it). The `errorType` is supplied by the
 * caller that builds the error (the V2 API-error mapper), not derived from V1 detectors.
 */
export class CustomAuthV2Error extends AuthFlowErrorBase {
    /**
     * The native auth V2 flow this error originated from.
     */
    readonly scenario: CustomAuthV2FlowScenario;

    /**
     * The classified category of this error, set by the caller that builds it
     * (Android parity). The `isXxx()` detectors compare against it.
     */
    readonly errorType: CustomAuthV2ErrorType;

    /**
     * Creates a new CustomAuthV2Error.
     * @param errorData - The underlying error details.
     * @param scenario - The flow the error originated from. Defaults to "unknown".
     * @param errorType - The classified error category. Defaults to "generalError".
     */
    constructor(
        errorData: CustomAuthError,
        scenario: CustomAuthV2FlowScenario = "unknown",
        errorType: CustomAuthV2ErrorType = "generalError"
    ) {
        super(errorData);
        this.scenario = scenario;
        this.errorType = errorType;
    }

    /**
     * Checks if the operation the error was raised for is not yet implemented.
     * @returns True if the operation is not implemented, false otherwise.
     */
    isNotImplemented(): boolean {
        return this.errorType === "notImplemented";
    }

    /**
     * Checks if the error is due to the user not being found.
     * @returns True if the user was not found, false otherwise.
     */
    isUserNotFound(): boolean {
        return this.errorType === "userNotFound";
    }

    /**
     * Checks if the error is due to the username being invalid.
     * @returns True if the username is invalid, false otherwise.
     */
    isInvalidUsername(): boolean {
        return this.errorType === "invalidUsername";
    }

    /**
     * Checks if the error is due to the provided code being invalid.
     * @returns True if the code is invalid, false otherwise.
     */
    isInvalidCode(): boolean {
        return this.errorType === "invalidCode";
    }

    /**
     * Checks if the error is due to the requested challenge being invalid or unsupported.
     * @returns True if the challenge is invalid, false otherwise.
     */
    isInvalidChallenge(): boolean {
        return this.errorType === "invalidChallenge";
    }

    /**
     * Checks if the error is due to the password being invalid.
     * @returns True if the password is invalid, false otherwise.
     */
    isInvalidPassword(): boolean {
        return this.errorType === "invalidPassword";
    }

    /**
     * Checks if the error is due to the supplied credentials being invalid.
     * @returns True if the credentials are invalid, false otherwise.
     */
    isInvalidCredentials(): boolean {
        return this.errorType === "invalidCredentials";
    }

    /**
     * Checks if the error is due to the user not having a password set.
     * @returns True if the user does not have a password, false otherwise.
     */
    isUserDoesNotHavePassword(): boolean {
        return this.errorType === "userDoesNotHavePassword";
    }

    /**
     * Checks if the error is due to the user already existing.
     * @returns True if the user already exists, false otherwise.
     */
    isUserAlreadyExists(): boolean {
        return this.errorType === "userAlreadyExists";
    }

    /**
     * Checks if the error is due to the selected authentication method being blocked.
     * @returns True if the authentication method is blocked, false otherwise.
     */
    isAuthMethodBlocked(): boolean {
        return this.errorType === "authMethodBlocked";
    }

    /**
     * Checks if the error is due to the verification contact being blocked.
     * @returns True if the verification contact is blocked, false otherwise.
     */
    isVerificationContactBlocked(): boolean {
        return this.errorType === "verificationContactBlocked";
    }

    /**
     * Checks if the error is due to invalid input being provided.
     * @returns True if the input is invalid, false otherwise.
     */
    isInvalidInput(): boolean {
        return this.errorType === "invalidInput";
    }

    /**
     * Checks if the error is due to one or more required attributes being invalid.
     * @returns True if the attributes are invalid, false otherwise.
     */
    isInvalidAttributes(): boolean {
        return this.errorType === "invalidAttributes";
    }

    /**
     * Checks if the error requires the flow to continue in the browser.
     * @returns True if the browser is required, false otherwise.
     */
    isBrowserRequired(): boolean {
        return this.errorType === "browserRequired";
    }

    /**
     * Checks if the error is a general, uncategorized failure.
     * @returns True if the error is a general error, false otherwise.
     */
    isGeneralError(): boolean {
        return this.errorType === "generalError";
    }
}
