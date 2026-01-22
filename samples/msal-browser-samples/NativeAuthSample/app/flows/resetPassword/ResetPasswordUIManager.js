/*
 * Reset Password UI Manager for MSAL Native Auth Sample
 *
 * This module handles all password reset related UI display and DOM manipulation.
 * Event handling is delegated to ResetPasswordEventCoordinator.
 */

import { ResetPasswordEventCoordinator } from "./ResetPasswordEventCoordinator.js";
import { AuthMethodSelectionForm } from "../../shared/jit/AuthMethodSelectionForm.js";
import { AuthMethodChallengeForm } from "../../shared/jit/AuthMethodChallengeForm.js";
import { MfaMethodSelectionForm } from "../../shared/mfa/MfaMethodSelectionForm.js";
import { MfaChallengeForm } from "../../shared/mfa/MfaChallengeForm.js";
import { formManager } from "../../ui/FormManager.js";

export class ResetPasswordUIManager {
    constructor(msalInstance) {
        // Initialize shared JIT/MFA form components
        this.jitMethodForm = new AuthMethodSelectionForm("resetpassword");
        this.jitChallengeForm = new AuthMethodChallengeForm("resetpassword");
        this.mfaMethodForm = new MfaMethodSelectionForm("resetpassword");
        this.mfaChallengeForm = new MfaChallengeForm("resetpassword");

        // Create event coordinator for all event handling
        this.eventCoordinator = new ResetPasswordEventCoordinator(
            this,
            msalInstance
        );
    }

    // ========== Reset Password Form Display Methods ==========

    /**
     * Show the reset password form (email input)
     */
    showResetPasswordForm() {
        console.log("Showing reset password form");

        // Clear any pending JIT/MFA form state
        this.hideJitMethodForm();
        this.hideJitChallengeForm();
        this.hideMfaMethodForm();
        this.hideMfaChallengeForm();

        // Clear JIT and MFA form internal state
        if (this.jitMethodForm) {
            this.jitMethodForm.clear();
        }
        if (this.jitChallengeForm) {
            this.jitChallengeForm.clear();
        }
        if (this.mfaMethodForm) {
            this.mfaMethodForm.clear();
        }
        if (this.mfaChallengeForm) {
            this.mfaChallengeForm.clear();
        }

        // Use FormManager to show reset password card
        formManager.showForm("resetPasswordCard", {
            clearInputs: true,
            focusInputId: "resetPasswordEmail",
            onShow: () => {
                this.displayMessage("", "info", "resetPasswordMessage");
            },
        });
    }

    /**
     * Show the reset password code verification form
     */
    showResetPasswordCodeForm(email) {
        console.log("Showing reset password code verification form");

        // Use FormManager to show the shared code verification card
        formManager.showForm("codeVerificationCard", {
            clearInputs: true,
            focusInputId: "verificationCode",
            onShow: () => {
                // Update instructions with email
                formManager.updateText(
                    "codeInstructions",
                    `A verification code has been sent to ${email}. Please check your email and enter the code below:`
                );

                // Set up reset-password-specific event handlers
                this.eventCoordinator.setupCodeVerificationHandlers();
            },
        });
    }

    /**
     * Show the reset password new password form
     */
    showResetPasswordNewPasswordForm() {
        console.log("Showing reset password new password form");

        // Use FormManager to show reset password new password card
        formManager.showForm("resetPasswordNewPasswordCard", {
            clearInputs: true,
            focusInputId: "resetPasswordNewPassword",
            onShow: () => {
                this.displayMessage(
                    "",
                    "info",
                    "resetPasswordNewPasswordMessage"
                );
            },
        });
    }

    /**
     * Hide new password form and return to reset password form
     */
    hideResetPasswordNewPasswordForm() {
        // showResetPasswordForm will hide all forms first (via FormManager.showForm)
        // and then show the reset password form with cleared inputs
        this.showResetPasswordForm();
    }

    /**
     * Show success message with option to sign in
     */
    showResetPasswordSuccessWithSignIn() {
        console.log(
            "Password reset completed successfully with automatic sign-in"
        );

        // Hide the new password form and return to reset password form
        this.hideResetPasswordNewPasswordForm();

        // Clear any pending operations
        this.eventCoordinator.clearPendingOperation();
    }

    // ========== JIT (Just-In-Time) Form Display Methods ==========

    /**
     * Show JIT authentication method selection form
     */
    showJitMethodForm(methods) {
        console.log("Showing JIT method selection form for reset password");

        // Deactivate all navigation buttons during JIT flow
        const showSignInBtn = document.getElementById("showSignInBtn");
        const showSignUpBtn = document.getElementById("showSignUpBtn");
        const showResetPasswordBtn = document.getElementById(
            "showResetPasswordBtn"
        );
        if (showSignInBtn) showSignInBtn.classList.remove("active");
        if (showSignUpBtn) showSignUpBtn.classList.remove("active");
        if (showResetPasswordBtn)
            showResetPasswordBtn.classList.remove("active");

        formManager.showForm("jitMethodSelectionCard", {
            onShow: () => {
                this.jitMethodForm.initialize(methods);
                this.jitMethodForm.show();
            },
        });
    }

    /**
     * Hide JIT method selection form
     */
    hideJitMethodForm() {
        formManager.hideForms(["jitMethodSelectionCard"]);
        this.jitMethodForm.hide();
    }

    /**
     * Show JIT challenge form (verification code input)
     */
    showJitChallengeForm(authMethodType, verificationContact) {
        console.log("Showing JIT challenge form for reset password");
        formManager.showForm("jitChallengeCard", {
            onShow: () => {
                this.jitChallengeForm.show(authMethodType, verificationContact);
            },
        });
    }

    /**
     * Hide JIT challenge form
     */
    hideJitChallengeForm() {
        formManager.hideForms(["jitChallengeCard"]);
        this.jitChallengeForm.hide();
    }

    // ========== MFA (Multi-Factor Authentication) Form Display Methods ==========

    /**
     * Show MFA authentication method selection form
     */
    showMfaMethodForm(methods) {
        console.log("Showing MFA method selection form for reset password");

        // Deactivate all navigation buttons during MFA flow
        const showSignInBtn = document.getElementById("showSignInBtn");
        const showSignUpBtn = document.getElementById("showSignUpBtn");
        const showResetPasswordBtn = document.getElementById(
            "showResetPasswordBtn"
        );
        if (showSignInBtn) showSignInBtn.classList.remove("active");
        if (showSignUpBtn) showSignUpBtn.classList.remove("active");
        if (showResetPasswordBtn)
            showResetPasswordBtn.classList.remove("active");

        formManager.showForm("mfaMethodSelectionCard", {
            onShow: () => {
                this.mfaMethodForm.initialize(methods);
                this.mfaMethodForm.show();
            },
        });
    }

    /**
     * Hide MFA method selection form
     */
    hideMfaMethodForm() {
        formManager.hideForms(["mfaMethodSelectionCard"]);
        this.mfaMethodForm.hide();
    }

    /**
     * Show MFA challenge form (verification code input)
     */
    showMfaChallengeForm(selectedMethod) {
        console.log("Showing MFA challenge form for reset password");
        formManager.showForm("mfaChallengeCard", {
            onShow: () => {
                this.mfaChallengeForm.show(selectedMethod);
            },
        });
    }

    /**
     * Hide MFA challenge form
     */
    hideMfaChallengeForm() {
        formManager.hideForms(["mfaChallengeCard"]);
        this.mfaChallengeForm.hide();
    }

    // ========== Message Display and Form State Helpers ==========

    /**
     * Display a message in the specified message container
     */
    displayMessage(message, type, containerId) {
        const messageContainer = document.getElementById(containerId);
        if (messageContainer) {
            messageContainer.textContent = message;
            messageContainer.className = `message ${type}`;
            messageContainer.style.display = message ? "block" : "none";
        }
    }

    /**
     * Show success message when code is resent
     */
    showCodeResendSuccess() {
        console.log("Code resent successfully");

        // Show a temporary success message
        const errorBanner = document.getElementById("errorBanner");
        const errorMessageElement = document.getElementById("errorMessage");

        if (errorBanner && errorMessageElement) {
            errorMessageElement.textContent =
                "Verification code has been resent to your email.";
            errorBanner.style.display = "flex";
            errorBanner.style.backgroundColor = "rgba(75, 181, 67, 0.2)";
            errorBanner.style.borderColor = "#4bb543";
            errorMessageElement.style.color = "#2c7b25";

            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorBanner.style.display = "none";
                errorBanner.style.backgroundColor = "";
                errorBanner.style.borderColor = "";
                errorMessageElement.style.color = "";
            }, 5000);
        }
    }

    /**
     * Disable all input fields in a form
     */
    disableFormInputs(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll("input, button");
            inputs.forEach((input) => {
                input.disabled = true;
            });
        }
    }

    /**
     * Enable all input fields in a form
     */
    enableFormInputs(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll("input, button");
            inputs.forEach((input) => {
                input.disabled = false;
            });
        }
    }

    /**
     * Clear all input fields in a form
     */
    clearFormInputs(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll(
                'input[type="text"], input[type="email"], input[type="password"]'
            );
            inputs.forEach((input) => {
                input.value = "";
            });
        }
    }

    /**
     * Set loading state for a button
     */
    setButtonLoading(button, isLoading) {
        if (!button) return;

        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = "Loading...";
        } else {
            button.disabled = false;
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
            }
        }
    }

    /**
     * Reset button to original state
     */
    resetButton(button) {
        if (!button) return;

        button.disabled = false;
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
            delete button.dataset.originalText;
        }
    }
}
