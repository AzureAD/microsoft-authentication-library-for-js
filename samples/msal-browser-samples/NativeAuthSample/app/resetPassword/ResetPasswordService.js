/*
 * Reset Password Service for MSAL Native Auth Sample
 * 
 * This service handles all password reset related authentication operations, including
 * email submission, code verification, and new password submission. It provides a clean
 * interface for password reset functionality following the same pattern as sign-up.
 */

import { Utilities } from '../utilities.js';

export class ResetPasswordService {
    constructor(msalInstance) {
        this.msalInstance = msalInstance;
        this.pendingResetResult = null;
        this.currentEmail = null;
    }

    /**
     * Updates the MSAL instance
     * @param {Object} msalInstance - The new MSAL instance
     */
    setMsalInstance(msalInstance) {
        this.msalInstance = msalInstance;
    }

    /**
     * Initiates password reset flow with email
     * @param {string} email - The email for password reset
     * @returns {Promise<Object>} Reset password result with success status and next steps
     */
    async resetPassword(email) {
        try {
            if (!this.msalInstance) {
                throw new Error("MSAL instance not initialized");
            }

            if (!email) {
                throw new Error("Email is required");
            }

            Utilities.logMessage(`Starting password reset for: ${email}`, "info");

            // Store current email for potential later use
            this.currentEmail = email;

            // Use MSAL native auth password reset start
            const result = await this.msalInstance.resetPassword({
                username: email
            });

            return await this.handleResetPasswordResult(result);
        } catch (error) {
            Utilities.logMessage(`Password reset failed: ${error}`, "error");
            return { success: false, error: error.message };
        }
    }

    /**
     * Handle the result from MSAL password reset operations
     * @param {Object} result - The result from MSAL password reset call
     * @returns {Promise<Object>} Processed result with success status and state info
     */
    async handleResetPasswordResult(result) {
        if (!result) {
            return { success: false, error: "No result received from password reset operation" };
        }

        // 1. Check if password reset FAILED
        if (result.isFailed()) {
            Utilities.logMessage("STATE: FAILED - Password reset failed", "error");
            if (result.error) {
                Utilities.logMessage(`Error details: ${JSON.stringify(result.error, null, 2)}`, "error");
            }
            return { success: false, result: result, error: result.error.errorData, state: 'failed'};
        }
        
        // 2. Check if CODE is REQUIRED (Email verification)
        if (result.isCodeRequired && result.isCodeRequired()) {
            Utilities.logMessage("STATE: CODE_REQUIRED - Email verification code needed", "info");

            // Store the result for later use
            this.pendingResetResult = result;

            return {
                success: false, 
                result: result, 
                state: 'code_required',
                email: this.currentEmail
            };
        }
        
        // 3. Check if PASSWORD is REQUIRED (New password submission)
        if (result.isPasswordRequired && result.isPasswordRequired()) {
            Utilities.logMessage("STATE: PASSWORD_REQUIRED - New password needed", "info");

            // Store the result for later use
            this.pendingResetResult = result;

            return {
                success: false, 
                result: result, 
                state: 'password_required',
                email: this.currentEmail
            };
        }

        // 4. Check if password reset is COMPLETE/SUCCESS
        if (result.isCompleted && result.isCompleted()) {
            Utilities.logMessage("STATE: SUCCESS - Password reset completed successfully", "success");
            
            // Check if state has signIn method and call it for automatic sign-in after password reset
            if (result.state && typeof result.state.signIn === 'function') {
                Utilities.logMessage("STATE: AUTO_SIGNIN - Attempting automatic sign-in after password reset completion", "info");
                Utilities.logMessage("🔍 RESET PASSWORD SERVICE: Auto sign-in method found, attempting sign-in...", "info");
                try {
                    const signInResult = await result.state.signIn();
                    Utilities.logMessage("STATE: AUTO_SIGNIN_SUCCESS - Automatic sign-in completed", "success");
                    
                    // Clear pending result on success
                    this.pendingResetResult = null;
                    
                    const finalResult = {
                        success: true,
                        result: signInResult,
                        account: signInResult.data || result.data,
                        state: 'completed_with_signin',
                        email: this.currentEmail,
                        autoSignIn: true
                    };
                    
                    Utilities.logMessage("🔍 RESET PASSWORD SERVICE: Final auto sign-in result success", "info");
                    return finalResult;
                } catch (signInError) {
                    Utilities.logMessage(`STATE: AUTO_SIGNIN_FAILED - Automatic sign-in failed: ${signInError}`, "warning");
                    Utilities.logMessage(`🔍 RESET PASSWORD SERVICE: Auto sign-in failed: ${signInError}`, "error");
                    // Fall back to regular completion without automatic sign-in
                }
            } else {
                Utilities.logMessage("🔍 RESET PASSWORD SERVICE: No auto sign-in method available", "info");
                Utilities.logMessage(`🔍 RESET PASSWORD SERVICE: result.state available: ${!!result.state}`, "info");
                Utilities.logMessage(`🔍 RESET PASSWORD SERVICE: typeof result.state?.signIn: ${typeof result.state?.signIn}`, "info");
            }
            
            // Clear pending result on success
            this.pendingResetResult = null;
            
            return {
                success: true,
                result: result,
                account: result.data,
                state: 'completed',
                email: this.currentEmail
            };
        }

        // Default case - unknown state
        Utilities.logMessage(`STATE: UNKNOWN - Unhandled result state: ${JSON.stringify(result, null, 2)}`, "warning");
        return { success: false, result: result, state: 'unknown' };
    }
    
    /**
     * Submits new password for password reset when required
     * @param {string} password - The new password
     * @returns {Promise<Object>} Password submission result
     */
    async submitPassword(password) {
        try {
            if (!this.pendingResetResult) {
                throw new Error("No pending password reset operation found");
            }

            if (!password) {
                throw new Error("Password is required");
            }

            Utilities.logMessage(`Submitting new password for reset...`, "info");

            // Submit the password using the pending result
            const result = await this.pendingResetResult.state.submitNewPassword(password);
            
            // Handle the result of password submission
            const finalResult = await this.handleResetPasswordResult(result);
            
            if (finalResult.success) {
                // Clear the pending result on success
                this.pendingResetResult = null;
            }
            
            return finalResult;

        } catch (error) {
            Utilities.logMessage(`Password submission failed: ${error}`, "error");
            Utilities.logMessage(`Submit password error: ${error}`, "error");
            return { success: false, error: error.message };
        }
    }

    /**
     * Submits verification code for email verification during password reset
     * @param {string} code - The 8-digit verification code received via email
     * @returns {Promise<Object>} Verification result
     */
    async submitCode(code) {
        try {
            Utilities.logMessage("🔍 RESET PASSWORD SERVICE: submitCode called", "info");
            
            if (!this.pendingResetResult) {
                throw new Error("No pending password reset operation found");
            }

            if (!code) {
                throw new Error("Verification code is required");
            }

            // Validate code format (8 digits)
            if (!/^\d{8}$/.test(code)) {
                throw new Error("Verification code must be 8 digits");
            }

            Utilities.logMessage(`Submitting verification code: ${code}`, "info");

            Utilities.logMessage("Submitting code for password reset...", "info");
            // Submit the code using the pending result
            const result = await this.pendingResetResult.state.submitCode(code);
            
            // Handle the result of code submission
            const finalResult = await this.handleResetPasswordResult(result);
            
            if (finalResult.success) {
                // Clear the pending result on success
                this.pendingResetResult = null;
            }
            
            return finalResult;

        } catch (error) {
            Utilities.logMessage(`Code submission failed: ${error}`, "error");
            Utilities.logMessage(`Submit code error: ${error}`, "error");
            return { success: false, error: error.message };
        }
    }

    /**
     * Resends verification code for email verification
     * @returns {Promise<Object>} Resend operation result
     */
    async resendCode() {
        try {
            if (!this.pendingResetResult) {
                throw new Error("No pending password reset operation found");
            }

            Utilities.logMessage("Resending verification code...", "info");

            // Check if resend method is available
            if (this.pendingResetResult.state.resendCode) {
                await this.pendingResetResult.state.resendCode();
                Utilities.logMessage("Verification code resent successfully", "success");
                return { success: true };
            } else {
                throw new Error("Resend code method not available");
            }

        } catch (error) {
            Utilities.logMessage(`Failed to resend code: ${error}`, "error");
            Utilities.logMessage(`Resend code error: ${error}`, "error");
            return { success: false, error: error.message };
        }
    }

    /**
     * Clears any pending password reset operation
     */
    clearPendingOperation() {
        this.pendingResetResult = null;
        this.currentEmail = null;
        Utilities.logMessage("Pending password reset operation cleared", "info");
    }

    /**
     * Checks if there's a pending password reset operation
     */
    hasPendingOperation() {
        return this.pendingResetResult !== null;
    }

    /**
     * Gets the current email being used for password reset
     * @returns {string|null} The current email or null if not set
     */
    getCurrentEmail() {
        return this.currentEmail;
    }
}
