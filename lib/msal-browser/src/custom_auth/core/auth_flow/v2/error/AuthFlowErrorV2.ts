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

export type AuthFlowErrorContextV2 =
    | "default"
    | "mfaVerification"
    | "authMethodRegistration";

/**
 * Error returned by a native authentication V2 operation.
 * @warning This API is experimental. It may be changed in the future without notice. Do not use in production applications.
 */
export class AuthFlowErrorV2 {
    readonly scenario: CustomAuthFlowScenarioV2;

    constructor(
        public errorData: CustomAuthError,
        scenario: CustomAuthFlowScenarioV2 = CustomAuthFlowScenarioV2.Unknown,
        private readonly errorContext: AuthFlowErrorContextV2 = "default"
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

    get requiredAttributes(): readonly string[] {
        return this.getAttributeIdsByCode("attributeRequired");
    }

    get invalidAttributes(): readonly string[] {
        return this.getAttributeIdsByCode("attributeValidationFailed");
    }

    /**
     * Checks whether the flow must continue in the browser.
     * @returns True if the browser is required, false otherwise.
     */
    isBrowserRequired(): boolean {
        return (
            this.errorData.error === "invalid_grant" &&
            this.errorData.subError === WEB_REDIRECT_REQUIRED
        );
    }

    /**
     * Checks whether a caller-supplied argument failed client-side validation.
     * @returns True if the input was invalid, false otherwise.
     */
    isInvalidInput(): boolean {
        return this.errorData instanceof InvalidArgumentError;
    }

    /**
     * Checks whether the supplied username failed local validation.
     * @returns True when local username validation failed.
     */
    isInvalidUsername(): boolean {
        return (
            this.errorData instanceof InvalidArgumentError &&
            this.errorData.argName === "inputs.username"
        );
    }

    /**
     * Checks whether the supplied username does not identify an account.
     * @returns True when the service reports that the user was not found.
     */
    isUserNotFound(): boolean {
        return this.isUserNotFoundError();
    }

    /**
     * Checks whether the service rejected a one-time code.
     * @returns True when the one-time code is invalid, otherwise false.
     */
    isInvalidCode(): boolean {
        return this.errorContext === "default" && this.isInvalidCodeError();
    }

    /**
     * Checks whether the service rejected an MFA or registration challenge.
     * @returns True when the verification challenge is invalid.
     */
    isInvalidChallenge(): boolean {
        return (
            (this.errorContext === "mfaVerification" ||
                this.errorContext === "authMethodRegistration") &&
            this.isInvalidCodeError()
        );
    }

    /**
     * Checks whether the service rejected non-password attributes.
     * Password-targeted validation is reported only by isInvalidPassword().
     * @returns True when at least one non-password attribute is invalid.
     */
    isInvalidAttributes(): boolean {
        if (
            !this.isAttributeValidationError() ||
            this.isPasswordAttributeValidationError()
        ) {
            return false;
        }

        const attributeIds = this.getAttributeValidationDetails()
            .flatMap((detail) =>
                Array.isArray(detail.attributeIds) ? detail.attributeIds : []
            )
            .filter(
                (attributeId): attributeId is string =>
                    typeof attributeId === "string"
            );

        return attributeIds.some((attributeId) => attributeId.length > 0);
    }

    /**
     * Checks whether the service rejected a supplied password.
     * @returns True when the supplied password is invalid, otherwise false.
     */
    isInvalidPassword(): boolean {
        return (
            this.isPasswordIncorrectError() ||
            this.isInvalidPasswordError() ||
            this.isPasswordAttributeValidationError()
        );
    }

    private isAttributeValidationError(): boolean {
        return (
            this.errorData.error === "invalidRequest" &&
            this.innerErrorCode === ATTRIBUTE_VALIDATION_ERROR
        );
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
        if (!this.isAttributeValidationError()) {
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
