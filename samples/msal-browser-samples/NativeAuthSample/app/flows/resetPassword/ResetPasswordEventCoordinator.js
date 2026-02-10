/*
 * Reset Password Event Coordinator for MSAL Native Auth Sample
 *
 * Coordinates event handling for Reset Password flow by:
 * 1. Managing basic password reset handlers (email, code, new password)
 * 2. Delegating JIT registration to shared JitAuthHandlers (via BaseEventCoordinator)
 * 3. Delegating MFA verification to shared MfaAuthHandlers (via BaseEventCoordinator)
 */

import uiManager from "../../ui/ui.js";
import { BaseEventCoordinator } from "../../shared/BaseEventCoordinator.js";
import { codeVerificationManager } from "../../ui/CodeVerificationManager.js";
import { getClaimsForAuth } from "../../configParser.js";

export class ResetPasswordEventCoordinator extends BaseEventCoordinator {
    constructor(uiManager, msalInstance) {
        // Call parent constructor with msalInstance and flowType
        super(uiManager, msalInstance, "resetpassword");

        // Store SDK state for continuation methods
        this.resetPasswordState = null;
        this.signInState = null; // State for JIT/MFA continuation after auto sign-in
    }

    /**
     * Initialize reset password specific event listeners
     * Called by BaseEventCoordinator.initializeEventListeners()
     */
    initializeFlowSpecificListeners() {
        // Reset Password Form
        const resetPasswordForm = document.getElementById("resetPasswordForm");
        if (resetPasswordForm) {
            resetPasswordForm.addEventListener(
                "submit",
                this.handleResetPasswordSubmit.bind(this)
            );
            console.log("Reset password form event listener attached");
        } else {
            console.warn("Reset password form not found in DOM");
        }

        // Reset Password New Password Form
        const resetPasswordNewPasswordForm = document.getElementById(
            "resetPasswordNewPasswordForm"
        );
        if (resetPasswordNewPasswordForm) {
            resetPasswordNewPasswordForm.addEventListener(
                "submit",
                this.handleResetPasswordNewPasswordSubmit.bind(this)
            );
        }
    }

    /**
     * Set up handlers for code verification form
     * Uses the CodeVerificationManager to properly manage handlers for the shared
     * code verification form across different flows (signin/signup/resetpassword).
     */
    setupCodeVerificationHandlers() {
        console.log("Setting up reset password code verification handlers");

        // Use CodeVerificationManager to set up handlers for resetpassword context
        codeVerificationManager.setupForContext(
            "resetpassword",
            this.handleResetPasswordCodeSubmit.bind(this),
            this.handleResetPasswordResendCode.bind(this),
            this.handleCancelResetPasswordCode.bind(this)
        );

        console.log(
            "Reset password code verification handlers set up successfully"
        );
    }

    // ========== Reset Password Basic Flow Handlers ==========

    /**
     * Handle reset password form submission (email input)
     */
    async handleResetPasswordSubmit(event) {
        event.preventDefault();

        const email = document.getElementById("resetPasswordEmail").value;
        const submitButton = event.target.querySelector(
            'button[type="submit"]'
        );

        try {
            console.log(`Reset password submit - email: ${email}`);

            // Disable the submit button and show loading state
            this.uiManager.setButtonLoading(submitButton, true);
            this.uiManager.disableFormInputs("resetPasswordForm");

            // Call MSAL SDK directly
            const result = await this.msalInstance.resetPassword({
                username: email,
            });

            // Store state for continuation methods
            this.resetPasswordState = result.state;

            // Handle different result states
            if (result.isFailed()) {
                const error =
                    result.error?.errorData?.message ||
                    result.error?.message ||
                    "Password reset failed";
                uiManager.showErrorBanner(error, "resetpassword");
            } else if (result.isCodeRequired()) {
                // Show code verification form
                this.uiManager.showResetPasswordCodeForm(email);
            }
        } catch (error) {
            console.error(`Reset password error: ${error}`);
            uiManager.showErrorBanner(
                error.message || "An error occurred during password reset",
                "resetpassword"
            );
        } finally {
            // Re-enable the form
            this.uiManager.setButtonLoading(submitButton, false);
            this.uiManager.enableFormInputs("resetPasswordForm");
        }
    }

    /**
     * Handle reset password code verification form submission
     */
    async handleResetPasswordCodeSubmit(event) {
        event.preventDefault();

        const code = document.getElementById("verificationCode").value;
        const submitButton = event.target.querySelector(
            'button[type="submit"]'
        );

        try {
            console.log(`Reset password code submit - code: ${code}`);

            // Disable the submit button and show loading state
            this.uiManager.setButtonLoading(submitButton, true);
            this.uiManager.disableFormInputs("codeVerificationForm");

            // Submit the code using stored state
            if (!this.resetPasswordState) {
                throw new Error("No pending reset password operation");
            }

            const result = await this.resetPasswordState.submitCode(code);

            // Update state for next continuation - only if not failed to preserve valid state
            if (!result.isFailed()) {
                this.resetPasswordState = result.state;
            }

            // Handle different result states
            if (result.isFailed()) {
                // Show error
                const error =
                    result.error?.errorData?.message ||
                    result.error?.message ||
                    "Code verification failed";
                uiManager.showErrorBanner(error, "resetpassword");
            } else if (result.isPasswordRequired()) {
                // Show new password input form
                this.uiManager.showResetPasswordNewPasswordForm();
            }
        } catch (error) {
            console.error("Reset password code submission error", error);
            uiManager.showErrorBanner(
                error.message || "An error occurred during code verification",
                "resetpassword"
            );
        } finally {
            // Re-enable the form
            this.uiManager.setButtonLoading(submitButton, false);
            this.uiManager.enableFormInputs("codeVerificationForm");
        }
    }

    /**
     * Handle cancel button click in code verification
     */
    handleCancelResetPasswordCode(event) {
        event.preventDefault();
        console.log("Canceling reset password code verification");
        this.uiManager.showResetPasswordForm();

        // Clear stored state
        this.resetPasswordState = null;
    }

    /**
     * Handle resend reset password code button click
     */
    async handleResetPasswordResendCode(event) {
        event.preventDefault();

        const resendCodeBtn = document.getElementById("resendCodeBtn");
        const originalText = resendCodeBtn
            ? resendCodeBtn.textContent
            : "Resend Code";

        try {
            console.log("Resending reset password code...");

            // Show loading state
            if (resendCodeBtn)
                this.uiManager.setButtonLoading(resendCodeBtn, "Resending...");

            // Resend code using stored state
            if (!this.resetPasswordState) {
                throw new Error("No pending reset password operation");
            }

            const result = await this.resetPasswordState.resendCode();

            // Update state after resend - safely handle state updates
            if (result.state) {
                this.resetPasswordState = result.state;
            }

            if (result.isCodeRequired()) {
                console.log("Verification code has been resent to your email");
                this.uiManager.showCodeResendSuccess();
            } else if (result.isFailed()) {
                const error = result.error;
                const errorMessage =
                    error?.errorData?.message ||
                    error?.message ||
                    (typeof error === "string"
                        ? error
                        : "Failed to resend code");
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error("Resend code error", error);
            uiManager.showErrorBanner(
                error.message || "Failed to resend verification code",
                "resetpassword"
            );
        } finally {
            // Reset button state
            if (resendCodeBtn)
                this.uiManager.resetButton(resendCodeBtn, originalText);
        }
    }

    /**
     * Handle reset password new password form submission
     */
    async handleResetPasswordNewPasswordSubmit(event) {
        event.preventDefault();

        const password = document.getElementById(
            "resetPasswordNewPassword"
        ).value;
        const submitButton = event.target.querySelector(
            'button[type="submit"]'
        );

        try {
            console.log("Submitting new password...");

            // Disable the submit button and show loading state
            this.uiManager.setButtonLoading(submitButton, true);
            this.uiManager.disableFormInputs("resetPasswordNewPasswordForm");

            // Submit the new password using stored state
            if (!this.resetPasswordState) {
                throw new Error("No pending reset password operation");
            }

            const result = await this.resetPasswordState.submitNewPassword(
                password
            );

            // Update state for next continuation
            this.resetPasswordState = result.state;

            // Handle different result states
            if (result.isCompleted()) {
                // Password reset completed, perform auto sign-in
                console.log(
                    "🔍 RESET PASSWORD COORDINATOR: Password reset completed, performing auto sign-in"
                );

                // Get claims if useMFA=true in URL params (must be JSON string for continuation token)
                const claimsObject = getClaimsForAuth();
                const claims = claimsObject
                    ? JSON.stringify(claimsObject)
                    : undefined;

                // Perform auto sign-in after password reset completion
                const signInResult = await this.resetPasswordState.signIn(
                    claims ? { claims } : undefined
                );

                // Update state to sign-in state for continuation
                this.signInState = signInResult.state;

                if (signInResult.isFailed()) {
                    const error = signInResult.error;
                    throw new Error(
                        error?.message ||
                            error ||
                            "Auto sign-in failed after password reset"
                    );
                }

                if (signInResult.isAuthMethodRegistrationRequired()) {
                    // Show JIT method selection form for auto sign-in after password reset
                    const authMethods = signInResult.state.getAuthMethods();
                    this.uiManager.showJitMethodForm(authMethods);
                } else if (signInResult.isMfaRequired()) {
                    // Show MFA method selection form for auto sign-in after password reset
                    const authMethods = signInResult.state.getAuthMethods();
                    this.uiManager.showMfaMethodForm(authMethods);
                } else if (signInResult.isCompleted()) {
                    // Auto sign-in completed successfully
                    const account = signInResult.data;
                    if (account) {
                        console.log(
                            "🔍 RESET PASSWORD COORDINATOR: Updating account info after auto sign-in"
                        );
                        uiManager.updateAccountInfo(account);
                        console.log(
                            "🔍 RESET PASSWORD COORDINATOR: Account info updated successfully"
                        );
                    } else {
                        console.warn(
                            "🔍 RESET PASSWORD COORDINATOR: No account returned after auto sign-in"
                        );
                    }
                    this.uiManager.showResetPasswordSuccessWithSignIn();
                }
            } else if (result.isFailed()) {
                // Show error
                const error = result.error;
                const errorMessage =
                    error?.errorData?.message ||
                    error?.message ||
                    (typeof error === "string"
                        ? error
                        : "Failed to set new password");
                uiManager.showErrorBanner(errorMessage, "resetpassword");
            }
        } catch (error) {
            console.error("New password submission error", error);
            uiManager.showErrorBanner(
                error.message || "An error occurred while setting new password",
                "resetpassword"
            );
        } finally {
            // Re-enable the form
            this.uiManager.setButtonLoading(submitButton, false);
            this.uiManager.enableFormInputs("resetPasswordNewPasswordForm");
        }
    }

    // ========== Helper Methods for JIT/MFA ==========
    // These methods provide state access for shared handlers

    /**
     * Get current state object for shared handlers
     */
    getPendingState() {
        return this.signInState || this.resetPasswordState;
    }

    /**
     * Update state after continuation methods
     */
    setPendingState(state) {
        if (this.signInState) {
            this.signInState = state;
        } else {
            this.resetPasswordState = state;
        }
    }

    /**
     * Clear pending operation
     */
    clearPendingOperation() {
        this.resetPasswordState = null;
        this.signInState = null;
    }
}
