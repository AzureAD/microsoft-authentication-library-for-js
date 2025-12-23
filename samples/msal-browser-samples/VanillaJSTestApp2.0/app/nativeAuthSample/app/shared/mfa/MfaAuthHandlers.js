/*
 * Shared MFA (Multi-Factor Authentication) Handlers
 * Used by SignIn, SignUp, and ResetPassword flows
 *
 * MFA verification happens during auto sign-in after account creation or password reset,
 * so the logic is identical across all flows.
 */

import uiManager from "../../ui/ui.js";

export class MfaAuthHandlers {
    /**
     * @param {Object} uiManager - The UI manager instance for the flow
     * @param {Object} coordinator - The event coordinator instance (provides access to state)
     * @param {string} context - The flow context ('signin', 'signup', or 'resetpassword')
     */
    constructor(uiManager, coordinator, context) {
        this.uiManager = uiManager;
        this.coordinator = coordinator;
        this.context = context;
    }

    /**
     * Handle MFA method selection form submission
     */
    async handleMfaMethodSubmit(event) {
        event.preventDefault();

        const submitBtn = document.getElementById("submitMfaMethodBtn");
        const originalText = submitBtn ? submitBtn.textContent : "Continue";

        try {
            // Show loading state
            this.uiManager.mfaMethodForm.setLoading(true);
            if (submitBtn)
                this.uiManager.setButtonLoading(submitBtn, "Processing...");

            // Get selected method
            const selectedMethod =
                this.uiManager.mfaMethodForm.getSelectedMethod();

            if (!selectedMethod) {
                throw new Error("Please select an MFA method");
            }

            // Get current state from coordinator
            const state = this.coordinator.getPendingState();
            if (!state) {
                throw new Error("No pending authentication operation");
            }

            // Log state type for debugging
            console.log("MFA state type:", state.constructor.name);
            console.log(
                "MFA state methods:",
                Object.getOwnPropertyNames(Object.getPrototypeOf(state))
            );

            // Call SDK state method to request MFA challenge
            const result = await state.requestChallenge(selectedMethod.id);

            // Handle result states
            if (result.isFailed()) {
                const error = result.error?.errorData;
                throw new Error(
                    error?.message || "Failed to select MFA method"
                );
            }

            if (result.isVerificationRequired()) {
                // Verification required - store state and show challenge form
                this.coordinator.setPendingState(result.state);
                const methodName =
                    selectedMethod.challenge_channel === "email"
                        ? "Email"
                        : "SMS";
                this.uiManager.showMfaChallengeForm(methodName);
            } else {
                throw new Error("Unexpected result from requestChallenge");
            }
        } catch (error) {
            console.error(`MFA method selection error: ${error}`);
            uiManager.showErrorBanner(
                error.message || "Failed to select MFA method",
                this.context
            );
        } finally {
            this.uiManager.mfaMethodForm.setLoading(false);
            if (submitBtn) this.uiManager.resetButton(submitBtn, originalText);
        }
    }

    /**
     * Handle MFA challenge (OTP verification) form submission
     */
    async handleMfaChallengeSubmit(event) {
        event.preventDefault();

        const submitBtn = document.getElementById("submitMfaChallengeBtn");
        const originalText = submitBtn ? submitBtn.textContent : "Verify";

        try {
            // Show loading state
            this.uiManager.mfaChallengeForm.setLoading(true);
            if (submitBtn)
                this.uiManager.setButtonLoading(submitBtn, "Verifying...");

            // Get challenge code
            const code = this.uiManager.mfaChallengeForm.getChallenge();

            if (!code) {
                throw new Error("Please enter the MFA code");
            }

            // Get current state from coordinator
            const state = this.coordinator.getPendingState();
            if (!state) {
                throw new Error("No pending authentication operation");
            }

            // Submit challenge using SDK state
            const result = await state.submitChallenge(code);

            // Handle result states
            if (result.isFailed()) {
                const error = result.error?.errorData;
                throw new Error(error?.message || "Invalid MFA code");
            }

            if (result.isCompleted()) {
                // Authentication completed successfully
                console.log("MFA authentication completed successfully");

                // Update coordinator state with completion state
                this.coordinator.setPendingState(result.state);

                const account = result.data;
                if (account) {
                    uiManager.updateAccountInfo(account);
                }
                this.uiManager.hideMfaChallengeForm();
                this.uiManager.mfaChallengeForm.clear();

                // Navigate back to the appropriate form with cleared inputs
                if (this.context === "signin") {
                    this.uiManager.showSignInForm();
                } else if (this.context === "signup") {
                    this.uiManager.showSignUpForm();
                } else if (this.context === "resetpassword") {
                    this.uiManager.showResetPasswordForm();
                }
            } else {
                throw new Error("Unexpected result from submitChallenge");
            }
        } catch (error) {
            console.error(`MFA challenge error: ${error}`);
            uiManager.showErrorBanner(
                error.message || "Invalid MFA code",
                this.context
            );
        } finally {
            this.uiManager.mfaChallengeForm.setLoading(false);
            if (submitBtn) this.uiManager.resetButton(submitBtn, originalText);
        }
    }

    /**
     * Handle cancel MFA flow
     */
    handleCancelMfa() {
        this.uiManager.hideMfaMethodForm();
        this.uiManager.hideMfaChallengeForm();
        this.uiManager.mfaChallengeForm.clear();

        // Return to the appropriate form based on context
        if (this.context === "signin") {
            this.uiManager.showSignInForm();
        } else if (this.context === "signup") {
            this.uiManager.showSignUpForm();
        } else if (this.context === "resetpassword") {
            this.uiManager.showResetPasswordForm();
        }

        // Clear pending operations
        if (this.coordinator) {
            this.coordinator.clearPendingOperation();
        }
    }
}
