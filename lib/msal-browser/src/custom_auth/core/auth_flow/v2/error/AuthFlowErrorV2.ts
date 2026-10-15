/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import type { CustomAuthError } from "../../../error/CustomAuthError.js";
import { CustomAuthApiError } from "../../../error/CustomAuthApiError.js";
import { InvalidArgumentError } from "../../../error/InvalidArgumentError.js";
import { WEB_REDIRECT_REQUIRED } from "../../../network_client/custom_auth_api/v2/ErrorCodesV2.js";
import {
    INVALID_ONE_TIME_CODE,
    INVALID_USERNAME_OR_PASSWORD,
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
     * server surfaces this as the `web_redirect_required` OAuth suberror, so a
     * browser hand-off arrives as a `FailedStateV2` on which this detector
     * returns true.
     * @returns True if the browser is required, false otherwise.
     */
    isBrowserRequired(): boolean {
        return this.errorData.subError === WEB_REDIRECT_REQUIRED;
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
     * Checks whether the service rejected the username parameter. Use it to ask
     * the user to correct the supplied username.
     * @returns True when the username is invalid, otherwise false.
     */
    isInvalidUsername(): boolean {
        return this.isUserInvalidError();
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
     * Checks whether the service rejected the supplied sign-in credentials. This
     * classifier does not identify new-password policy failures.
     * @returns True when the username or password is incorrect.
     */
    isInvalidCredentials(): boolean {
        return this.isPasswordIncorrectError();
    }

    /**
     * Checks whether the service rejected a one-time code. Use it to prompt the
     * user to re-enter the code or request a new one.
     * @returns True when the one-time code is invalid, otherwise false.
     */
    isInvalidCode(): boolean {
        return this.isInvalidCodeError();
    }

    /**
     * Checks whether a new password violates password policy. It recognizes
     * both weak-password responses and password-targeted validation details.
     * @returns True when the new password is invalid, otherwise false.
     */
    isInvalidPassword(): boolean {
        return (
            this.isInvalidPasswordError() ||
            this.isPasswordPolicyViolationError()
        );
    }

    /**
     * Checks whether an account already exists for the supplied identifier.
     * This can occur at different stages while completing sign-up.
     * @returns True if the account already exists, otherwise false.
     */
    isUserAlreadyExists(): boolean {
        return this.getAttributeValidationDetails().some(
            (detail) => detail.code === "userAlreadyExists"
        );
    }

    /**
     * Checks whether the service requires attributes omitted from the request.
     * Use it to collect the required attributes before resubmitting.
     * @returns True when required attributes are missing, otherwise false.
     */
    isMissingRequiredAttributes(): boolean {
        return this.requiredAttributes.length > 0;
    }

    private isUserNotFoundError(): boolean {
        return (
            this.errorData.error === "invalidRequest" &&
            (this.innerErrorCode === USER_NOT_FOUND ||
                this.errorData.errorDescription?.includes("AADSTS50034") ===
                    true)
        );
    }

    private isUserInvalidError(): boolean {
        return (
            this.errorData.error === "invalidRequest" &&
            this.errorData.errorDescription?.includes("AADSTS90100") === true &&
            this.errorData.errorDescription
                .toLowerCase()
                .includes("username parameter")
        );
    }

    private isInvalidCodeError(): boolean {
        return (
            this.errorData.error === "invalidGrant" &&
            this.innerErrorCode === INVALID_ONE_TIME_CODE
        );
    }

    private isInvalidPasswordError(): boolean {
        return (
            this.errorData.error === "invalidRequest" &&
            this.innerErrorCode === PASSWORD_TOO_WEAK
        );
    }

    private isPasswordPolicyViolationError(): boolean {
        return this.getAttributeValidationDetails().some((detail) => {
            const attributeIds: unknown = detail.attributeIds;

            return (
                detail.code === "passwordPolicyViolation" &&
                Array.isArray(attributeIds) &&
                attributeIds.some(
                    (attributeId: unknown) =>
                        typeof attributeId === "string" &&
                        attributeId.toLowerCase() === "password"
                )
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
