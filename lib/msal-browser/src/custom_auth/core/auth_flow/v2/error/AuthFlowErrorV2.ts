/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { CustomAuthError } from "../../../error/CustomAuthError.js";
import { CustomAuthApiError } from "../../../error/CustomAuthApiError.js";
import { InvalidArgumentError } from "../../../error/InvalidArgumentError.js";
import { WEB_REDIRECT_REQUIRED } from "../../../network_client/custom_auth_api/v2/ErrorCodesV2.js";
import {
    ATTRIBUTE_VALIDATION_ERROR,
    INVALID_ONE_TIME_CODE,
    INVALID_USERNAME_OR_PASSWORD,
    PASSWORD_BANNED,
    PASSWORD_IS_INVALID,
    PASSWORD_RECENTLY_USED,
    PASSWORD_TOO_LONG,
    PASSWORD_TOO_SHORT,
    PASSWORD_TOO_WEAK,
    USER_NOT_FOUND,
} from "./AuthFlowErrorSubcodesV2.js";
import { CustomAuthFlowScenarioV2 } from "../CustomAuthFlowScenarioV2.js";
import type { AttributeValidationDetailV2 } from "../../../network_client/custom_auth_api/v2/response/ErrorResponsesV2.js";

/**
 * Error returned by a native authentication V2 operation. Use its classifiers
 * to handle known failures while retaining raw diagnostics through `errorData`.
 */
export class AuthFlowErrorV2 {
    readonly scenario: CustomAuthFlowScenarioV2;

    constructor(
        public errorData: CustomAuthError,
        scenario: CustomAuthFlowScenarioV2 = CustomAuthFlowScenarioV2.Unknown,
        private readonly classification:
            | "default"
            | "challenge"
            | "username" = "default"
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

    get innerErrorCode(): string | undefined {
        return this.errorData instanceof CustomAuthApiError
            ? this.errorData.innerErrorCode
            : undefined;
    }

    /**
     * Gets the attribute ids that the service reports as required.
     */
    get requiredAttributes(): readonly string[] {
        return this.getAttributeIdsByCode("attributeRequired");
    }

    /**
     * Gets the attribute ids whose submitted values failed validation.
     */
    get invalidAttributes(): readonly string[] {
        return this.getAttributeIdsByCode("attributeValidationFailed");
    }

    /**
     * Checks if the error requires the flow to continue in the browser. The
     * server surfaces this as `invalid_grant` with the `web_redirect_required`
     * OAuth suberror, so a browser hand-off arrives as a `FailedStateV2` on which
     * this detector returns true.
     * @returns True if the browser is required, false otherwise.
     */
    isBrowserRequired(): boolean {
        return (
            this.errorData.error === "invalid_grant" &&
            this.errorData.subError === WEB_REDIRECT_REQUIRED
        );
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

    /**
     * Checks whether the supplied username failed local validation. Local username
     * failures also satisfy `isInvalidInput()`, unlike server attribute errors.
     * @returns True when local username validation failed.
     */
    isInvalidUsername(): boolean {
        return (
            this.classification === "username" &&
            this.errorData instanceof InvalidArgumentError
        );
    }

    /**
     * Checks whether the supplied username does not identify an account. Use it
     * to distinguish a missing account from other request failures.
     * @returns True when the service reports that the user was not found.
     */
    isUserNotFound(): boolean {
        return this.isUserNotFoundError();
    }

    /**
     * Checks whether the service rejected an ordinary one-time code. MFA and
     * registration verification failures are identified by `isInvalidChallenge()`.
     * @returns True when the ordinary one-time code is invalid.
     */
    isInvalidCode(): boolean {
        return this.classification !== "challenge" && this.isInvalidCodeError();
    }

    /**
     * Checks whether the service rejected an MFA or registration challenge.
     * Use it to distinguish challenge verification from ordinary code verification.
     * @returns True when the verification challenge is invalid.
     */
    isInvalidChallenge(): boolean {
        return this.classification === "challenge" && this.isInvalidCodeError();
    }

    /**
     * Checks whether the service reports an attribute-validation error. It applies
     * to all collected attributes, independently of the validation details.
     * @returns True when the service reports an attribute-validation error.
     */
    isInvalidAttributeError(): boolean {
        return (
            this.errorData.error === "invalidRequest" &&
            this.innerErrorCode === ATTRIBUTE_VALIDATION_ERROR
        );
    }

    /**
     * Checks whether the service rejected a supplied password. It recognizes
     * incorrect sign-in credentials, password-policy failures, and
     * password-targeted validation details.
     * @returns True when the supplied password is invalid, otherwise false.
     */
    isInvalidPassword(): boolean {
        return (
            this.isPasswordIncorrectError() ||
            this.isInvalidPasswordError() ||
            this.isPasswordAttributeValidationError()
        );
    }

    /**
     * Returns the original error's diagnostic string representation. Delegating
     * string conversion preserves existing diagnostic logging.
     * @returns The underlying error's string representation.
     */
    toString(): string {
        return this.errorData.toString();
    }

    private isUserNotFoundError(): boolean {
        return (
            this.errorData.error === "invalidRequest" &&
            this.innerErrorCode === USER_NOT_FOUND
        );
    }

    private isInvalidCodeError(): boolean {
        return (
            this.errorData.error === "invalidGrant" &&
            this.innerErrorCode === INVALID_ONE_TIME_CODE
        );
    }

    private isInvalidPasswordError(): boolean {
        const innerErrorCode = this.innerErrorCode;

        return (
            this.errorData.error === "invalidRequest" &&
            (innerErrorCode === PASSWORD_TOO_WEAK ||
                innerErrorCode === PASSWORD_TOO_SHORT ||
                innerErrorCode === PASSWORD_TOO_LONG ||
                innerErrorCode === PASSWORD_IS_INVALID ||
                innerErrorCode === PASSWORD_RECENTLY_USED ||
                innerErrorCode === PASSWORD_BANNED)
        );
    }

    private isPasswordAttributeValidationError(): boolean {
        if (!this.isInvalidAttributeError()) {
            return false;
        }

        return this.getAttributeValidationDetails().some((detail) => {
            const attributeIds: unknown = detail.attributeIds;

            return (
                Array.isArray(attributeIds) && attributeIds.includes("password")
            );
        });
    }

    private isPasswordIncorrectError(): boolean {
        return (
            this.errorData.error === "invalidGrant" &&
            this.innerErrorCode === INVALID_USERNAME_OR_PASSWORD
        );
    }

    private getAttributeValidationDetails(): AttributeValidationDetailV2[] {
        const details = (
            this.errorData as CustomAuthError & {
                attributeValidationDetails?: unknown;
            }
        ).attributeValidationDetails;

        return Array.isArray(details)
            ? details.filter(
                  (detail): detail is AttributeValidationDetailV2 =>
                      typeof detail === "object" && detail !== null
              )
            : [];
    }

    private getAttributeIdsByCode(code: string): string[] {
        const attributeIds = this.getAttributeValidationDetails().flatMap(
            (detail) =>
                detail.code === code && Array.isArray(detail.attributeIds)
                    ? detail.attributeIds.filter(
                          (attributeId): attributeId is string =>
                              typeof attributeId === "string"
                      )
                    : []
        );

        return [...new Set(attributeIds)];
    }
}
