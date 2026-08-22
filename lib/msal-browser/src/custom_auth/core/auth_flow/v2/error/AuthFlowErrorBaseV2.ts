/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { CustomAuthError } from "../../../error/CustomAuthError.js";
import { InvalidArgumentError } from "../../../error/InvalidArgumentError.js";
import { REDIRECT_TO_WEB } from "../../../network_client/custom_auth_api/v2/ErrorCodesV2.js";
import {
    INVALID_ONE_TIME_CODE,
    PASSWORD_TOO_WEAK,
} from "./AuthFlowErrorSubcodesV2.js";
import { CustomAuthFlowScenarioV2 } from "../CustomAuthFlowScenarioV2.js";

/*
 * Standalone V2 error base; intentionally does NOT extend the V1 AuthFlowErrorBase.
 * Provides the detectors common to every V2 flow; each per-action subclass adds only
 * the detectors relevant to its own action.
 */
export abstract class AuthFlowErrorBaseV2 {
    readonly scenario: CustomAuthFlowScenarioV2;

    constructor(
        public errorData: CustomAuthError,
        scenario: CustomAuthFlowScenarioV2 = CustomAuthFlowScenarioV2.Unknown
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
        return this.errorData.errorDescription;
    }

    /**
     * Checks if the error requires the flow to continue in the browser. The
     * server surfaces this as a `redirect_to_web` failure, so a browser hand-off
     * always arrives as a `FailedStateV2` on which this detector returns true.
     * @returns True if the browser is required, false otherwise.
     */
    isBrowserRequired(): boolean {
        return this.errorData.error === REDIRECT_TO_WEB;
    }

    /**
     * Checks if the error is due to a caller-supplied argument failing
     * client-side validation before the request was issued (for example an empty
     * username, code, or password, or an unknown method id). Use it to prompt the
     * user to correct the input rather than treating it as a server failure.
     * @returns True if the input was invalid, false otherwise.
     */
    isInvalidInput(): boolean {
        return this.errorData instanceof InvalidArgumentError;
    }

    /*
     * User-not-found arrives as AADSTS50034. The nested `/api` error carries no
     * innerError and no error_codes array, so the AADSTS marker in the message is
     * the only signal.
     */
    // TODO: Use the service-provided suberror when it becomes available.
    protected isUserNotFoundError(): boolean {
        return (
            this.errorData.error === "invalidRequest" &&
            this.errorData.errorDescription?.includes("AADSTS50034") === true
        );
    }

    protected isUserInvalidError(): boolean {
        return (
            this.errorData.error === "invalidRequest" &&
            this.errorData.errorDescription?.includes("AADSTS90100") ===
                true &&
            this.errorData.errorDescription
                .toLowerCase()
                .includes("username parameter")
        );
    }

    // The verification endpoint uses this outer/inner code pair for an invalid one-time code.
    protected isInvalidCodeError(): boolean {
        return (
            this.errorData.error === "invalidGrant" &&
            this.errorData.subError === INVALID_ONE_TIME_CODE
        );
    }

    // New password rejected by policy: inner `passwordTooWeak` (AADSTS120002).
    protected isInvalidPasswordError(): boolean {
        return (
            this.errorData.error === "invalidRequest" &&
            this.errorData.subError === PASSWORD_TOO_WEAK
        );
    }
}
