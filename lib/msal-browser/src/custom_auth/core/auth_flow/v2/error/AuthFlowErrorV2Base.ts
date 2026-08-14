/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { CustomAuthV2ApiError } from "../../../network_client/custom_auth_api/v2/error/CustomAuthV2ApiError.js";
import { CustomAuthV2FlowScenario } from "../../CustomAuthV2FlowScenario.js";

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
 * error handler.
 */
export abstract class AuthFlowErrorV2Base {
    readonly scenario: CustomAuthV2FlowScenario;

    constructor(
        public errorData: CustomAuthV2ApiError,
        scenario: CustomAuthV2FlowScenario = CustomAuthV2FlowScenario.Unknown
    ) {
        this.scenario = scenario;
    }

    get correlationId(): string | undefined {
        return this.errorData.correlationId;
    }

    get errorCodes(): number[] | undefined {
        return this.errorData.errorCodes;
    }

    get errorDescription(): string | undefined {
        return this.errorData.message;
    }

    /**
     * Checks if the error requires the flow to continue in the browser. This is
     * the terminal fallback for web fallback: the primary representation is the
     * success-path `WebFallbackRequiredState`, and this detector covers the case
     * where the same `redirect_to_web` signal is surfaced as a `FailedState`
     * failure instead of a continuable state.
     * @returns True if the browser is required, false otherwise.
     */
    isBrowserRequired(): boolean {
        return this.isBrowserRequiredError();
    }

    /**
     * Checks if the error is a general, uncategorized failure. Use it as a
     * fallback branch after the action-specific detectors so the app can show a
     * generic error message for failures it does not handle explicitly.
     * @returns True if the error is a general error, false otherwise.
     */
    isGeneralError(): boolean {
        return this.isGeneralErrorType();
    }

    /*
     * @todo Finalize the exact server code mapping with the V2 network error
     * handler. Browser-required is keyed off
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
