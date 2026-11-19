/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { formManager } from "../../ui/FormManager.js";
import { codeVerificationManager } from "../../ui/CodeVerificationManager.js";
import { getClaimsForAuth } from "../../configParser.js";
import { authMethodManagerV2 } from "./AuthMethodManager.js";

export class SignUpModuleV2 {
    constructor(msalInstance, uiManager) {
        this.msalInstance = msalInstance;
        this.uiManager = uiManager;
        this.state = null;
        this.operationId = 0;
        this.busy = false;
    }

    /**
     * Binds V2 sign-up to the shared forms and SDK-requested profile fields.
     * Initialize this module instead of the V1 sign-up module.
     */
    initialize() {
        document
            .getElementById("signUpForm")
            .addEventListener("submit", (event) => {
                event.preventDefault();
                if (this.busy) return;
                this.state = null;
                const data = new FormData(event.currentTarget);
                const attributes = Object.fromEntries(
                    [
                        ["givenName", "firstName"],
                        ["surname", "lastName"],
                        ["city", "city"],
                        ["country", "country"],
                    ]
                        .map(([attributeId, fieldName]) => [
                            attributeId,
                            data.get(fieldName),
                        ])
                        .filter(([, value]) => value)
                );
                void this.#runOperation("signUpBtn", "Starting...", () => {
                    const claims = getClaimsForAuth();
                    return this.msalInstance.signUpV2({
                        username: data.get("username"),
                        attributes,
                        ...(claims && { claims: JSON.stringify(claims) }),
                    });
                });
            });
        document
            .getElementById("signUpPasswordForm")
            .addEventListener("submit", (event) => {
                event.preventDefault();
                if (this.busy) return;
                const password = new FormData(event.currentTarget).get(
                    "password"
                );
                void this.#runOperation(
                    "submitSignUpPasswordBtn",
                    "Submitting...",
                    () => {
                        if (
                            this.state?.stateType !== "passwordRequired" &&
                            this.state?.stateType !==
                                "existingAccountPasswordRequired"
                        ) {
                            throw new Error(
                                "Restart sign-up before continuing."
                            );
                        }
                        return this.state.submitPassword(password);
                    }
                );
            });
        document
            .getElementById("signUpAttributesForm")
            .addEventListener("submit", (event) => {
                event.preventDefault();
                if (this.busy) return;
                const data = new FormData(event.currentTarget);
                void this.#runOperation(
                    "submitSignUpAttributesBtn",
                    "Submitting...",
                    () => {
                        if (this.state?.stateType !== "attributesRequired") {
                            throw new Error(
                                "Restart sign-up before continuing."
                            );
                        }
                        const attributes = Object.fromEntries(
                            this.state.attributes
                                .map(({ attributeId }) => [
                                    attributeId,
                                    data.get(attributeId),
                                ])
                                .filter(([, value]) => value)
                        );
                        return this.state.submitAttributes(attributes);
                    }
                );
            });
        for (const id of [
            "cancelSignUpPasswordBtn",
            "cancelSignUpAttributesBtn",
        ]) {
            document
                .getElementById(id)
                .addEventListener("click", () => this.#cancel());
        }
    }

    /**
     * Clears pending local sign-up state and ignores late operation results.
     * Already-sent service requests cannot be cancelled by this method.
     */
    clearPendingOperation() {
        this.operationId++;
        this.state = null;
        this.busy = false;
        codeVerificationManager.removeHandlers();
        authMethodManagerV2.removeHandlers();
        formManager.clearFormInputs("signUpCard");
        formManager.clearFormInputs("signUpPasswordCard");
        formManager.clearFormInputs("codeVerificationCard");
        document.getElementById("signUpAttributeFields").replaceChildren();
        formManager.hideForms(["signUpAttributesCard", "signUpPasswordCard"]);
        this.uiManager.hideErrorBanner();
        for (const [id, label] of [
            ["signUpBtn", "Sign Up"],
            ["submitSignUpPasswordBtn", "Create Account"],
            ["submitSignUpAttributesBtn", "Continue"],
            ["submitMfaMethodBtn", "Continue"],
            ["submitCodeBtn", "Verify Code"],
            ["resendCodeBtn", "Resend Code"],
        ]) {
            const button = document.getElementById(id);
            button.disabled = false;
            button.textContent = label;
        }
    }

    #cancel() {
        this.clearPendingOperation();
        formManager.showForm("signUpCard", {
            focusInputId: "signUpUsername",
        });
    }

    async #runOperation(buttonId, loadingText, action) {
        const operationId = ++this.operationId;
        const button = document.getElementById(buttonId);
        const label = button.textContent;
        this.busy = true;
        button.disabled = true;
        button.textContent = loadingText;
        this.uiManager.hideErrorBanner();
        try {
            await this.#handleResult(await action(), operationId);
        } catch {
            if (operationId === this.operationId) {
                this.uiManager.showErrorBanner(
                    "Unable to complete V2 sign-up. Please restart and try again.",
                    "signup"
                );
            }
        } finally {
            if (operationId === this.operationId) {
                this.busy = false;
                button.disabled = false;
                button.textContent = label;
                formManager.clearFormInputs("codeVerificationCard");
                formManager.clearFormInputs("signUpPasswordCard");
                formManager.clearFormInputs("jitChallengeCard");
                formManager.clearFormInputs("mfaChallengeCard");
            }
        }
    }

    async #handleResult(result, operationId) {
        if (operationId !== this.operationId) return;
        if (result.isFailed()) {
            const error = result.error;
            let message = "V2 sign-up failed. Please try again.";
            if (error.isBrowserRequired()) {
                message = "Sign-up cannot continue natively for this account.";
            } else if (
                error.isInvalidAttributes() ||
                [...error.requiredAttributes, ...error.invalidAttributes].some(
                    (attributeId) => attributeId.toLowerCase() !== "password"
                )
            ) {
                this.state = result.state;
                authMethodManagerV2.removeHandlers();
                codeVerificationManager.removeHandlers();
                formManager.showForm("signUpCard");
                message =
                    "Invalid sign-up attributes. Restart sign-up to correct the profile information.";
            } else if (error.isInvalidPassword()) {
                message =
                    this.state?.stateType === "existingAccountPasswordRequired"
                        ? "Invalid password. Please try again."
                        : "Invalid new password. Please try again.";
            } else if (error.isInvalidCode() || error.isInvalidChallenge()) {
                message = "Invalid verification code. Please try again.";
            } else if (error.errorData.error === "user_already_signed_in") {
                message = "You are already signed in.";
            } else if (error.isInvalidInput()) {
                message = "Invalid sign-up input.";
            }
            this.uiManager.showErrorBanner(message, "signup");
            return;
        }

        this.state = result.state;
        if (
            authMethodManagerV2.show(
                this.state,
                (buttonId, loadingText, action) => {
                    if (this.busy) return;
                    void this.#runOperation(buttonId, loadingText, action);
                },
                () => this.#cancel()
            )
        ) {
            codeVerificationManager.removeHandlers();
            return;
        }
        authMethodManagerV2.removeHandlers();
        if (result.isState("signInContinuation")) {
            await this.#handleResult(await this.state.signIn(), operationId);
        } else if (result.isState("completed")) {
            if (!result.data) {
                throw new Error("Completed sign-up did not return an account.");
            }
            this.state = null;
            codeVerificationManager.removeHandlers();
            formManager.hideAllForms();
            document.getElementById("signUpForm").reset();
            document.getElementById("signUpAttributeFields").replaceChildren();
            this.uiManager.updateAccountInfo(result.data);
        } else if (
            result.isState("passwordRequired") ||
            result.isState("existingAccountPasswordRequired")
        ) {
            codeVerificationManager.removeHandlers();
            const existingAccount = result.isState(
                "existingAccountPasswordRequired"
            );
            document.querySelector("#signUpPasswordCard h2").textContent =
                existingAccount ? "Existing Account" : "Create Password";
            document.getElementById("signUpPasswordInstructions").textContent =
                existingAccount
                    ? "Enter your existing password to sign in:"
                    : "Please create a password for your account:";
            const input = document.getElementById("signUpPassword");
            input.minLength = existingAccount ? 1 : 8;
            input.autocomplete = existingAccount
                ? "current-password"
                : "new-password";
            input.placeholder = existingAccount
                ? "Enter your existing password"
                : "Create a password";
            document.getElementById("submitSignUpPasswordBtn").textContent =
                existingAccount ? "Sign In" : "Create Account";
            formManager.showForm("signUpPasswordCard", {
                clearInputs: true,
                focusInputId: "signUpPassword",
            });
        } else if (result.isState("attributesRequired")) {
            codeVerificationManager.removeHandlers();
            this.#showAttributes();
        } else if (
            result.isState("codeRequired") ||
            result.isState("existingAccountCodeRequired")
        ) {
            this.#showCode();
        } else {
            codeVerificationManager.removeHandlers();
            this.uiManager.showErrorBanner(
                "This V2 sign-up step is not implemented in the sample yet.",
                "signup"
            );
        }
    }

    #showAttributes() {
        const fields = document.getElementById("signUpAttributeFields");
        fields.replaceChildren();
        this.state.attributes.forEach((attribute, index) => {
            const group = document.createElement("div");
            group.className = "form-group";
            const input = document.createElement("input");
            input.id = `signUpAttribute-${index}`;
            input.name = attribute.attributeId;
            input.type =
                attribute.inputType === "password" ? "password" : "text";
            input.required = attribute.required === true;
            if (attribute.regex) input.pattern = attribute.regex;
            const label = document.createElement("label");
            label.htmlFor = input.id;
            label.textContent = `${attribute.label || attribute.attributeId}${
                input.required ? " *" : " (optional)"
            }`;
            group.append(label, input);
            fields.appendChild(group);
        });
        formManager.showForm("signUpAttributesCard");
        fields.querySelector("input")?.focus();
    }

    #showCode() {
        codeVerificationManager.setupForContext(
            "signup-v2",
            (event) => {
                event.preventDefault();
                if (this.busy) return;
                const code = new FormData(event.currentTarget).get("code");
                void this.#runOperation("submitCodeBtn", "Verifying...", () => {
                    if (
                        this.state?.stateType !== "codeRequired" &&
                        this.state?.stateType !== "existingAccountCodeRequired"
                    ) {
                        throw new Error("Restart sign-up before continuing.");
                    }
                    return this.state.submitCode(code);
                });
            },
            () => {
                if (this.busy) return;
                void this.#runOperation("resendCodeBtn", "Sending...", () => {
                    if (
                        this.state?.stateType !== "codeRequired" &&
                        this.state?.stateType !== "existingAccountCodeRequired"
                    ) {
                        throw new Error("Restart sign-up before continuing.");
                    }
                    return this.state.resendCode();
                });
            },
            () => this.#cancel()
        );
        document.getElementById("verificationCode").maxLength =
            this.state.codeLength ?? 8;
        formManager.showForm("codeVerificationCard", {
            clearInputs: true,
            focusInputId: "verificationCode",
        });
    }
}
