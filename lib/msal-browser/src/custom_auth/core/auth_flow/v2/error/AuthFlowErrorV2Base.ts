/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { CustomAuthV2ApiError } from "./CustomAuthV2ApiError.js";
import type { CustomAuthV2FlowScenario } from "../../CustomAuthV2FlowScenario.js";

/*
 * Base class for all native auth V2 errors.
 *
 * Standalone V2 base: it does NOT extend the V1 `AuthFlowErrorBase`. It holds a
 * V2 wire-error payload ({@link CustomAuthV2ApiError}) as `errorData` and the
 * originating {@link CustomAuthV2FlowScenario}, and provides the detectors that
 * are common to every V2 flow. Each concrete per-action error subclass adds only
 * the `isXxx()` detectors relevant to its own action (mirroring the V1 per-action
 * error split), so an app inspecting `result.error` sees a small, relevant set.
 *
 * The protected `isXxxError()` helpers classify the underlying `errorData`; the
 * exact server codes they compare against are finalized alongside the V2 network
 * error handler in the SSPR implementation PR.
 */
export abstract class AuthFlowErrorV2Base {
    /*
     * The native auth V2 flow this error originated from.
     */
    readonly scenario: CustomAuthV2FlowScenario;

    /*
     * constructor for AuthFlowErrorV2Base
     * @param errorData - The underlying V2 server error payload.
     * @param scenario - The flow the error originated from. Defaults to "unknown".
     */
    constructor(
        public errorData: CustomAuthV2ApiError,
        scenario: CustomAuthV2FlowScenario = "unknown"
    ) {
        this.scenario = scenario;
    }

    /**
     * Correlation ID for the request that produced this error, surfaced from the
     * underlying {@link CustomAuthV2ApiError} for convenience.
     */
    get correlationId(): string | undefined {
        return this.errorData.correlationId;
    }

    /**
     * Numeric error codes returned by the server, surfaced from the underlying
     * {@link CustomAuthV2ApiError} for convenience.
     */
    get errorCodes(): number[] | undefined {
        return this.errorData.errorCodes;
    }

    /**
     * Human-readable description of the error, surfaced from the underlying
     * {@link CustomAuthV2ApiError} message for convenience.
     */
    get errorDescription(): string | undefined {
        return this.errorData.message;
    }

    /**
     * Checks if the error requires the flow to continue in the browser.
     *
     * Terminal fallback for web fallback. The primary representation of web
     * fallback is the success-path `WebFallbackRequiredState` (carries the
     * redirect `url`), surfaced whenever the server drives a `redirect_to_web` /
     * `webFallbackRequired` response mid-flow. This detector covers the terminal
     * case where the redirect is surfaced as a failure (`FailedState`) rather
     * than a continuable state — both key off the same `redirect_to_web` signal.
     * @returns True if the browser is required, false otherwise.
     */
    isBrowserRequired(): boolean {
        return this.isBrowserRequiredError();
    }

    /**
     * Checks if the error is a general, uncategorized failure.
     * @returns True if the error is a general error, false otherwise.
     */
    isGeneralError(): boolean {
        return this.isGeneralErrorType();
    }

    /*
     * @todo Finalize the exact server code mapping with the V2 network error
     * handler in the SSPR implementation PR. Browser-required is keyed off
     * `redirect_to_web` (per iOS `isWebFallbackRequired`) — NOT the entry
     * `insufficient_authorization` 401, which is the expected start-of-flow
     * response, not a failure.
     */
    protected isBrowserRequiredError(): boolean {
        return this.errorData.code === "redirect_to_web";
    }

    protected isGeneralErrorType(): boolean {
        return this.errorData.code === "generalError";
    }

    protected isUserNotFoundError(): boolean {
        return this.errorData.code === "user_not_found";
    }

    protected isInvalidUsernameError(): boolean {
        return this.errorData.code === "invalid_username";
    }

    protected isInvalidCodeError(): boolean {
        return this.errorData.innerErrorCode === "invalidOneTimeCode";
    }

    protected isInvalidPasswordError(): boolean {
        return this.errorData.innerErrorCode === "passwordInvalid";
    }

    protected isInvalidCredentialsError(): boolean {
        return this.errorData.code === "invalid_credentials";
    }

    protected isUserDoesNotHavePasswordError(): boolean {
        return this.errorData.innerErrorCode === "userDoesNotHavePassword";
    }

    protected isUserAlreadyExistsError(): boolean {
        return this.errorData.code === "user_already_exists";
    }
}
