/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { formManager } from "../../ui/FormManager.js";
import { codeVerificationManager } from "../../ui/CodeVerificationManager.js";
import { getClaimsForAuth } from "../../configParser.js";

export class ResetPasswordModuleV2 {
    constructor(msalInstance, uiManager) {
        this.msalInstance = msalInstance;
        this.uiManager = uiManager;
        this.state = null;
        this.operationId = 0;
        this.busy = false;
    }

    /**
     * Binds V2 password reset to the existing email, code and new-password forms.
     * Sign-in after reset uses the SDK's returned continuation state.
     */
    initialize() {
        document
            .getElementById("resetPasswordForm")
            .addEventListener("submit", (event) => {
                event.preventDefault();
                if (this.busy) return;
                this.state = null;
                const username = new FormData(event.currentTarget).get("email");
                void this.#runOperation(
                    "resetPasswordBtn",
                    "Starting...",
                    () => {
                        const claims = getClaimsForAuth();
                        return this.msalInstance.resetPasswordV2({
                            username,
                            ...(claims && { claims: JSON.stringify(claims) }),
                        });
                    }
                );
            });
        document
            .getElementById("resetPasswordNewPasswordForm")
            .addEventListener("submit", (event) => {
                event.preventDefault();
                if (this.busy) return;
                const password = new FormData(event.currentTarget).get(
                    "password"
                );
                void this.#runOperation(
                    "submitResetPasswordNewPasswordBtn",
                    "Resetting...",
                    () => {
                        if (this.state?.stateType !== "newPasswordRequired") {
                            throw new Error(
                                "Restart password reset before continuing."
                            );
                        }
                        return this.state.submitNewPassword(password);
                    }
                );
            });
        document
            .getElementById("cancelResetPasswordNewPasswordBtn")
            .addEventListener("click", () => this.#cancel());
    }

    /**
     * Clears pending local reset state and ignores late operation results.
     * Already-sent service requests cannot be cancelled by this method.
     */
    clearPendingOperation() {
        this.operationId++;
        this.state = null;
        this.busy = false;
        codeVerificationManager.removeHandlers();
        formManager.clearFormInputs("codeVerificationCard");
        formManager.clearFormInputs("resetPasswordNewPasswordCard");
        this.uiManager.hideErrorBanner();
        for (const [id, label] of [
            ["resetPasswordBtn", "Reset Password"],
            ["submitResetPasswordNewPasswordBtn", "Reset Password"],
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
        formManager.showForm("resetPasswordCard", {
            clearInputs: true,
            focusInputId: "resetPasswordEmail",
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
            const result = await action();
            await this.#handleResult(result, operationId);
        } catch {
            if (operationId === this.operationId) {
                this.uiManager.showErrorBanner(
                    "Unable to complete V2 password reset. Please restart and try again.",
                    "resetpassword"
                );
            }
        } finally {
            if (operationId === this.operationId) {
                this.busy = false;
                button.disabled = false;
                button.textContent = label;
                formManager.clearFormInputs("codeVerificationCard");
                formManager.clearFormInputs("resetPasswordNewPasswordCard");
            }
        }
    }

    async #handleResult(result, operationId) {
        if (operationId !== this.operationId) return;
        if (result.isFailed()) {
            const error = result.error;
            let message = "V2 password reset failed. Please try again.";
            if (error.isUserNotFound()) {
                message = "Account not found.";
            } else if (error.isInvalidCode()) {
                message = "Invalid verification code. Please try again.";
            } else if (error.isInvalidPassword()) {
                message = "Invalid new password. Please try again.";
            } else if (
                error.isBrowserRequired() ||
                error.errorData.error === "reset_password_unsupported" ||
                error.innerErrorCode === "passwordResetNotEnabledForUser"
            ) {
                message =
                    "Password reset cannot continue natively for this account.";
            } else if (error.isInvalidInput()) {
                message = "Invalid password-reset input.";
            }
            this.uiManager.showErrorBanner(message, "resetpassword");
            return;
        }

        this.state = result.state;
        if (result.isState("signInContinuation")) {
            await this.#handleResult(await this.state.signIn(), operationId);
        } else if (result.isState("completed")) {
            if (!result.data) {
                throw new Error(
                    "Completed password reset did not return an account."
                );
            }
            this.state = null;
            codeVerificationManager.removeHandlers();
            formManager.hideAllForms();
            document.getElementById("resetPasswordForm").reset();
            this.uiManager.updateAccountInfo(result.data);
        } else if (result.isState("newPasswordRequired")) {
            codeVerificationManager.removeHandlers();
            formManager.showForm("resetPasswordNewPasswordCard", {
                clearInputs: true,
                focusInputId: "resetPasswordNewPassword",
            });
        } else if (result.isState("codeRequired")) {
            codeVerificationManager.setupForContext(
                "resetpassword-v2",
                (event) => {
                    event.preventDefault();
                    if (this.busy) return;
                    const code = new FormData(event.currentTarget).get("code");
                    void this.#runOperation(
                        "submitCodeBtn",
                        "Verifying...",
                        () => {
                            if (this.state?.stateType !== "codeRequired") {
                                throw new Error(
                                    "Restart password reset before continuing."
                                );
                            }
                            return this.state.submitCode(code);
                        }
                    );
                },
                () => {
                    if (this.busy) return;
                    void this.#runOperation(
                        "resendCodeBtn",
                        "Sending...",
                        () => {
                            if (this.state?.stateType !== "codeRequired") {
                                throw new Error(
                                    "Restart password reset before continuing."
                                );
                            }
                            return this.state.resendCode();
                        }
                    );
                },
                () => this.#cancel()
            );
            document.getElementById("verificationCode").maxLength =
                this.state.codeLength ?? 8;
            formManager.showForm("codeVerificationCard", {
                clearInputs: true,
                focusInputId: "verificationCode",
            });
        } else {
            this.uiManager.showErrorBanner(
                "This V2 password-reset step is not implemented in the sample yet.",
                "resetpassword"
            );
        }
    }
}
