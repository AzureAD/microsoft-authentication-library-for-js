/*
 * Sign-Up UI Manager for MSAL Native Auth Sample
 *
 * This module handles all sign-up related UI interactions and DOM manipulation.
 * Event handling is delegated to SignUpEventCoordinator.
 */

import uiManager from "../../ui/ui.js";
import { SignUpEventCoordinator } from "./SignUpEventCoordinator.js";
import { formManager } from "../../ui/FormManager.js";
import { AuthMethodSelectionForm } from "../../shared/jit/AuthMethodSelectionForm.js";
import { AuthMethodChallengeForm } from "../../shared/jit/AuthMethodChallengeForm.js";
import { MfaMethodSelectionForm } from "../../shared/mfa/MfaMethodSelectionForm.js";
import { MfaChallengeForm } from "../../shared/mfa/MfaChallengeForm.js";

export class SignUpUIManager {
    constructor(msalInstance) {
        this.eventListenersInitialized = false;

        // Initialize shared JIT/MFA form components
        this.jitMethodForm = new AuthMethodSelectionForm("signup");
        this.jitChallengeForm = new AuthMethodChallengeForm("signup");
        this.mfaMethodForm = new MfaMethodSelectionForm("signup");
        this.mfaChallengeForm = new MfaChallengeForm("signup");

        // Create event coordinator to handle all event-related logic
        this.eventCoordinator = new SignUpEventCoordinator(this, msalInstance);

        // Initialize event listeners when DOM is ready
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                this.initializeEventListeners();
            });
        } else {
            // DOM is already ready
            this.initializeEventListeners();
        }
    }

    /**
     * Initialize all sign-up related event listeners
     */
    initializeEventListeners() {
        if (this.eventListenersInitialized) {
            return;
        }

        console.log("Initializing SignUpUIManager event listeners...");

        // Delegate event listener setup to coordinator
        this.eventCoordinator.initializeEventListeners();

        this.eventListenersInitialized = true;
        console.log("SignUpUIManager event listeners initialized successfully");
    }

    // ========== UI Display Methods ==========

    /**
     * Show sign-up form
     */
    showSignUpForm(event) {
        if (event) {
            event.preventDefault();
        }

        console.log("Showing sign-up form");

        // Use FormManager to show the sign-up card and clear inputs
        formManager.showForm("signUpCard", {
            clearInputs: true,
            focusInputId: "signUpUsername",
        });

        // Hide error banner
        uiManager.hideErrorBanner();
    }

    /**
     * Show code verification form
     * @param {string} username - The username/email for display
     * @param {string} context - The context ("signup" or "signin")
     */
    showCodeVerificationForm(username, context) {
        console.log("Showing code verification form");

        // Use FormManager to show the code verification card
        formManager.showForm("codeVerificationCard", {
            clearInputs: true,
            focusInputId: "verificationCode",
            onShow: () => {
                // Update instructions with username if provided
                if (username) {
                    formManager.updateText(
                        "codeInstructions",
                        `Please check your email (${username}) and enter the verification code below:`
                    );
                }

                // Set up context-specific handlers
                if (context) {
                    this.eventCoordinator.setupCodeVerificationHandlers(
                        context
                    );
                }
            },
        });

        // Hide error banner
        uiManager.hideErrorBanner();
    }

    /**
     * Show password input form (for passwordless sign-up requiring password later)
     * @param {string} username - The username/email for display
     */
    showPasswordInputForm(username) {
        console.log("Showing password input form");

        // Use FormManager to show the sign-up password card
        formManager.showForm("signUpPasswordCard", {
            clearInputs: true,
            focusInputId: "signUpPassword",
            onShow: () => {
                // Update instructions with username if provided
                if (username) {
                    formManager.updateText(
                        "signUpPasswordInstructions",
                        `Enter a password for ${username}:`
                    );
                }

                // Set up password input handlers
                this.eventCoordinator.setupPasswordInputHandlers();
            },
        });
    }

    /**
     * Show attributes form (if additional user attributes are required)
     */
    showAttributesForm(result) {
        console.log("Additional attributes required for sign-up");
        uiManager.showErrorBanner(
            "Additional information is required to complete registration.",
            "signup"
        );
    }

    /**
     * Hide code verification form and return to sign-up form
     */
    hideCodeVerificationForm() {
        formManager.clearFormInputs("codeVerificationCard");
        this.showSignUpForm();
    }

    /**
     * Hide password input form and return to sign-up form
     */
    hidePasswordInputForm() {
        formManager.clearFormInputs("passwordInputCard");
        this.showSignUpForm();
    }

    // ========== JIT (Just-In-Time) Registration Methods ==========

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

    // ========== MFA (Multi-Factor Authentication) Methods ==========

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

    // ========== Error Handling Methods ==========

    showSignUpError(errorData) {
        let message = "Sign-up failed. Please try again.";

        if (errorData) {
            if (typeof errorData === "string") {
                message = errorData;
            } else if (errorData.error_description) {
                message = errorData.error_description;
            } else if (errorData.message) {
                message = errorData.message;
            }
        }

        console.error(`Sign-up error: ${message}`);
        uiManager.showErrorBanner(message, "signup");
    }

    showCodeVerificationError(message) {
        console.error(`Code verification error: ${message}`);
        uiManager.showErrorBanner(message, "signup");
    }

    showCodeResendError(message) {
        console.error(`Code resend error: ${message}`);
        uiManager.showErrorBanner(
            `Failed to resend code: ${message}`,
            "signup"
        );
    }

    showPasswordError(message) {
        console.error(`Password error: ${message}`);
        uiManager.showErrorBanner(message, "signup");
    }

    // ========== Success Display Methods ==========

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
                uiManager.hideErrorBanner();
                // Reset styles
                errorBanner.style.backgroundColor = "";
                errorBanner.style.borderColor = "";
                errorMessageElement.style.color = "";
            }, 5000);
        }
    }

    // ========== UI Helper Methods ==========

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
