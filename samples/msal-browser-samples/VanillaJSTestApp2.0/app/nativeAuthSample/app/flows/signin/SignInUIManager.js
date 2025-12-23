/*
 * Sign-In UI Manager for MSAL Native Auth Sample
 */

import uiManager from "../../ui/ui.js";
import { AuthMethodSelectionForm } from "../../shared/jit/AuthMethodSelectionForm.js";
import { AuthMethodChallengeForm } from "../../shared/jit/AuthMethodChallengeForm.js";
import { MfaMethodSelectionForm } from "../../shared/mfa/MfaMethodSelectionForm.js";
import { MfaChallengeForm } from "../../shared/mfa/MfaChallengeForm.js";
import { SignInEventCoordinator } from "./SignInEventCoordinator.js";
import { formManager } from "../../ui/FormManager.js";

export class SignInUIManager {
    constructor(msalInstance) {
        // Initialize shared JIT/MFA form components
        this.jitMethodForm = new AuthMethodSelectionForm("signin");
        this.jitChallengeForm = new AuthMethodChallengeForm("signin");
        this.mfaMethodForm = new MfaMethodSelectionForm("signin");
        this.mfaChallengeForm = new MfaChallengeForm("signin");

        // Initialize event coordinator
        this.eventHandlers = new SignInEventCoordinator(this, msalInstance);
    }

    // Navigation Methods
    showSignInForm() {
        const showSignInBtn = document.getElementById("showSignInBtn");
        const showSignUpBtn = document.getElementById("showSignUpBtn");

        // Update button states
        if (showSignInBtn) showSignInBtn.classList.add("active");
        if (showSignUpBtn) showSignUpBtn.classList.remove("active");

        // Use FormManager to show sign-in card
        formManager.showForm("signInCard", {
            clearInputs: true,
            focusInputId: "username",
        });

        // Hide JIT and MFA forms
        this.hideJitMethodForm();
        this.hideJitChallengeForm();
        this.hideMfaMethodForm();
        this.hideMfaChallengeForm();
    }

    showJitMethodForm(authMethods) {
        // Use FormManager to show JIT method selection
        formManager.showForm("jitMethodSelectionCard", {
            onShow: () => {
                // Initialize and show JIT method selection form
                this.jitMethodForm.initialize(authMethods);
                this.jitMethodForm.show();
            },
        });
    }

    hideJitMethodForm() {
        formManager.hideForms(["jitMethodSelectionCard"]);
        this.jitMethodForm.hide();
    }

    showJitChallengeForm(methodName) {
        // Use FormManager to show JIT challenge card
        formManager.showForm("jitChallengeCard", {
            onShow: () => {
                this.jitChallengeForm.show(methodName);
            },
        });
    }

    hideJitChallengeForm() {
        formManager.hideForms(["jitChallengeCard"]);
        this.jitChallengeForm.hide();
    }

    showMfaMethodForm(authMethods) {
        // Use FormManager to show MFA method selection
        formManager.showForm("mfaMethodSelectionCard", {
            onShow: () => {
                // Initialize and show MFA method selection form
                this.mfaMethodForm.initialize(authMethods);
                this.mfaMethodForm.show();
            },
        });
    }

    hideMfaMethodForm() {
        formManager.hideForms(["mfaMethodSelectionCard"]);
        this.mfaMethodForm.hide();
    }

    showMfaChallengeForm(methodName) {
        // Use FormManager to show MFA challenge card
        formManager.showForm("mfaChallengeCard", {
            onShow: () => {
                this.mfaChallengeForm.show(methodName);
            },
        });
    }

    hideMfaChallengeForm() {
        formManager.hideForms(["mfaChallengeCard"]);
        this.mfaChallengeForm.hide();
    }

    showCodeVerificationForm(username) {
        // Use FormManager to show code verification card
        formManager.showForm("codeVerificationCard", {
            clearInputs: true,
            focusInputId: "verificationCode",
            onShow: () => {
                // Update instructions with username
                formManager.updateText(
                    "codeInstructions",
                    `A verification code has been sent to ${username}. Please check your email and enter the code below:`
                );

                // Set up context-specific event handlers
                this.eventHandlers.setupCodeVerificationHandlers("signin");
            },
        });
    }

    showPasswordInputForm(username) {
        // Use FormManager to show password input card
        formManager.showForm("passwordInputCard", {
            clearInputs: true,
            focusInputId: "signInPassword",
            onShow: () => {
                // Update instructions with username
                formManager.updateText(
                    "passwordInstructions",
                    `Please enter your password for ${username} to complete sign-in:`
                );
            },
        });
    }

    hideCodeVerificationForm() {
        formManager.clearFormInputs("codeVerificationCard");
        this.showSignInForm();
    }

    hidePasswordInputForm() {
        formManager.clearFormInputs("passwordInputCard");
        this.showSignInForm();
    }

    clearSignInForm() {
        const signUpForm = document.getElementById("signInForm");
        if (signUpForm) {
            signUpForm.reset();
        }
    }

    // UI Helper Methods
    setButtonLoading(button, text) {
        if (button) {
            button.disabled = true;
            button.innerHTML = `<span class="loading"></span>${text}`;
        }
    }

    resetButton(button, originalText) {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}
