/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { formManager } from "../../ui/FormManager.js";
import { codeVerificationManager } from "../../ui/CodeVerificationManager.js";
import { getClaimsForAuth } from "../../configParser.js";
import { authMethodManagerV2 } from "./AuthMethodManager.js";

export class SignInModuleV2 {
    constructor(msalInstance, uiManager) {
        this.msalInstance = msalInstance;
        this.uiManager = uiManager;
        this.state = null;
        this.operationId = 0;
        this.busy = false;
    }

    /**
     * Binds V2 sign-in to the existing username, password and code forms.
     * Initialize this module instead of the V1 flow modules.
     */
    initialize() {
        document
            .getElementById("signInForm")
            .addEventListener("submit", (event) => {
                event.preventDefault();
                if (this.busy) return;
                this.state = null;
                const username = new FormData(event.currentTarget).get(
                    "username"
                );
                this.#runOperation("signInBtn", "Signing in...", () => {
                    const claims = getClaimsForAuth();
                    return this.msalInstance.signInV2({
                        username,
                        ...(claims && { claims: JSON.stringify(claims) }),
                    });
                });
            });
        document
            .getElementById("passwordInputForm")
            .addEventListener("submit", (event) => {
                event.preventDefault();
                if (this.busy) return;
                const password = new FormData(event.currentTarget).get(
                    "password"
                );
                this.#runOperation("submitPasswordBtn", "Signing in...", () => {
                    if (this.state?.stateType !== "passwordRequired") {
                        throw new Error("Restart sign-in before continuing.");
                    }
                    return this.state.submitPassword(password);
                });
            });
        for (const id of ["cancelPasswordBtn", "showSignInBtn"]) {
            document
                .getElementById(id)
                .addEventListener("click", () => this.#cancel());
        }
    }

    /**
     * Clears the pending local flow and ignores any outstanding result.
     * It does not cancel an already-sent server request.
     */
    clearPendingOperation() {
        this.operationId++;
        this.state = null;
        this.busy = false;
        formManager.clearFormInputs("passwordInputCard");
        formManager.clearFormInputs("codeVerificationCard");
        codeVerificationManager.removeHandlers();
        authMethodManagerV2.removeHandlers();
        this.uiManager.hideErrorBanner();
        for (const [id, label] of [
            ["signInBtn", "Sign In"],
            ["submitPasswordBtn", "Submit Password"],
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
        formManager.showForm("signInCard", {
            clearInputs: true,
            focusInputId: "username",
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
                    "Unable to complete V2 sign-in. Please restart and try again.",
                    "signin"
                );
            }
        } finally {
            if (operationId === this.operationId) {
                this.busy = false;
                button.disabled = false;
                button.textContent = label;
                formManager.clearFormInputs("passwordInputCard");
                formManager.clearFormInputs("codeVerificationCard");
                formManager.clearFormInputs("jitChallengeCard");
                formManager.clearFormInputs("mfaChallengeCard");
            }
        }
    }

    async #handleResult(result, operationId) {
        if (operationId !== this.operationId) return;
        if (result.isFailed()) {
            const error = result.error;
            let message = "V2 sign-in failed. Please try again.";
            if (error.isBrowserRequired()) {
                message = "Continue this sign-in in a browser.";
            } else if (error.isUserNotFound()) {
                message = "Account not found.";
            } else if (error.isInvalidPassword()) {
                message = "Invalid password. Please try again.";
            } else if (error.isInvalidCode() || error.isInvalidChallenge()) {
                message = "Invalid verification code. Please try again.";
            } else if (error.errorData.error === "user_already_signed_in") {
                message = "You are already signed in.";
            } else if (error.isInvalidInput()) {
                message = "Invalid sign-in input.";
            }
            this.uiManager.showErrorBanner(message, "signin");
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
                throw new Error("Completed sign-in did not return an account.");
            }
            this.state = null;
            codeVerificationManager.removeHandlers();
            formManager.hideAllForms();
            document.getElementById("signInForm").reset();
            this.uiManager.updateAccountInfo(result.data);
        } else if (result.isState("passwordRequired")) {
            formManager.showForm("passwordInputCard", {
                clearInputs: true,
                focusInputId: "signInPassword",
            });
        } else if (result.isState("codeRequired")) {
            codeVerificationManager.setupForContext(
                "signin-v2",
                (event) => {
                    event.preventDefault();
                    if (this.busy) return;
                    const code = new FormData(event.currentTarget).get("code");
                    this.#runOperation("submitCodeBtn", "Verifying...", () => {
                        if (this.state?.stateType !== "codeRequired") {
                            throw new Error(
                                "Restart sign-in before continuing."
                            );
                        }
                        return this.state.submitCode(code);
                    });
                },
                () => {
                    if (this.busy) return;
                    this.#runOperation("resendCodeBtn", "Sending...", () => {
                        if (this.state?.stateType !== "codeRequired") {
                            throw new Error(
                                "Restart sign-in before continuing."
                            );
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
        } else {
            this.uiManager.showErrorBanner(
                "This V2 sign-in step is not implemented in the sample yet.",
                "signin"
            );
        }
    }
}
