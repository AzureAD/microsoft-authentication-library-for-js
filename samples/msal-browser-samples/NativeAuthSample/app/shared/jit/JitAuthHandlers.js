/*
 * Shared JIT (Just-In-Time) Authentication Handlers
 * Used by SignIn, SignUp, and ResetPassword flows
 *
 * JIT registration happens during auto sign-in after account creation or password reset,
 * so the logic is identical across all flows.
 */

import uiManager from "../../ui/ui.js";

export class JitAuthHandlers {
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
     * Handle JIT method selection form submission
     */
    async handleJitMethodSubmit(event) {
        event.preventDefault();

        const submitBtn = document.getElementById("submitJitMethodBtn");
        const originalText = submitBtn ? submitBtn.textContent : "Continue";

        try {
            // Show loading state
            this.uiManager.jitMethodForm.setLoading(true);
            if (submitBtn)
                this.uiManager.setButtonLoading(submitBtn, "Processing...");

            // Get selected method and verification contact
            const selectedMethod =
                this.uiManager.jitMethodForm.getSelectedMethod();
            const verificationContact =
                this.uiManager.jitMethodForm.getVerificationContact();

            console.log(`Selected method: ${JSON.stringify(selectedMethod)}`);
            console.log(`Verification contact: ${verificationContact}`);

            if (!selectedMethod) {
                throw new Error("Please select an authentication method");
            }

            if (!verificationContact) {
                throw new Error("Please provide your contact information");
            }

            // Get current state from coordinator
            const state = this.coordinator.getPendingState();
            if (!state) {
                throw new Error("No pending authentication operation");
            }

            // Call SDK state method to select JIT method
            // SDK expects AuthMethodDetails object with authMethodType and verificationContact
            const result = await state.challengeAuthMethod({
                authMethodType: selectedMethod,
                verificationContact: verificationContact,
            });

            // Handle result states
            if (result.isFailed()) {
                console.log("JIT method selection failed");
                const error = result.error?.errorData;
                throw new Error(
                    error?.message || "Failed to select authentication method"
                );
            }

            if (result.isCompleted()) {
                // JIT registration completed without verification (rare case)
                console.log(
                    "JIT registration completed successfully without verification"
                );
                const account = result.data;
                if (account) {
                    uiManager.updateAccountInfo(account);
                }
                this.coordinator.setPendingState(result.state);
                this.uiManager.hideJitMethodForm();
            } else if (
                result.isVerificationRequired &&
                result.isVerificationRequired()
            ) {
                console.log(
                    "JIT registration requires verification - showing challenge form"
                );
                // Verification required - store state and show challenge form
                this.coordinator.setPendingState(result.state);
                const methodName =
                    selectedMethod.challenge_channel === "email"
                        ? "Email"
                        : "SMS";
                this.uiManager.showJitChallengeForm(methodName);
            } else {
                throw new Error("Unexpected result from challengeAuthMethod");
            }
        } catch (error) {
            console.error(`JIT method selection error: ${error}`);
            uiManager.showErrorBanner(
                error.message || "Failed to select authentication method",
                this.context
            );
        } finally {
            this.uiManager.jitMethodForm.setLoading(false);
            if (submitBtn) this.uiManager.resetButton(submitBtn, originalText);
        }
    }

    /**
     * Handle JIT challenge (OTP verification) form submission
     */
    async handleJitChallengeSubmit(event) {
        event.preventDefault();

        const submitBtn = document.getElementById("submitJitChallengeBtn");
        const originalText = submitBtn ? submitBtn.textContent : "Verify";

        try {
            // Show loading state
            this.uiManager.jitChallengeForm.setLoading(true);
            if (submitBtn)
                this.uiManager.setButtonLoading(submitBtn, "Verifying...");

            // Get challenge code
            const code = this.uiManager.jitChallengeForm.getChallenge();

            if (!code) {
                throw new Error("Please enter the verification code");
            }

            // Get current state from coordinator
            const state = this.coordinator.getPendingState();
            if (!state) {
                throw new Error("No pending authentication operation");
            }

            // Submit challenge using SDK state
            const result = await state.submitChallenge(code);

            // Update coordinator state
            this.coordinator.setPendingState(result.state);

            // Handle result states
            if (result.isFailed()) {
                console.log("JIT method selection failed");
                const error = result.error?.errorData;
                throw new Error(
                    error?.message || "Failed to select authentication method"
                );
            }

            // Handle result states
            if (result.isCompleted()) {
                // Authentication completed successfully
                console.log("JIT registration completed successfully");
                const account = result.data;
                if (account) {
                    uiManager.updateAccountInfo(account);
                }
                this.uiManager.hideJitChallengeForm();
                this.uiManager.jitChallengeForm.clear();

                // Navigate back to the appropriate form with cleared inputs
                if (this.context === "signin") {
                    this.uiManager.showSignInForm();
                } else if (this.context === "signup") {
                    this.uiManager.showSignUpForm();
                } else if (this.context === "resetpassword") {
                    this.uiManager.showResetPasswordForm();
                }
            } else {
                throw new Error("Invalid verification code");
            }
        } catch (error) {
            console.error(`JIT challenge error: ${error}`);
            uiManager.showErrorBanner(
                error.message || "Invalid verification code",
                this.context
            );
        } finally {
            this.uiManager.jitChallengeForm.setLoading(false);
            if (submitBtn) this.uiManager.resetButton(submitBtn, originalText);
        }
    }

    /**
     * Handle cancel JIT flow
     */
    handleCancelJit() {
        this.uiManager.hideJitMethodForm();
        this.uiManager.hideJitChallengeForm();
        this.uiManager.jitChallengeForm.clear();

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
