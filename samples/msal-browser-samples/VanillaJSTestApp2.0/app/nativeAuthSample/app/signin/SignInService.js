/*
 * Sign-In Service for MSAL Native Auth Sample
 */

import { Utilities } from '../utilities.js';

export class SignInService {
    constructor(msalInstance) {
        this.msalInstance = msalInstance;
        this.pendingSignInResult = null;
    }

    // Update the MSAL instance (used when app initializes)
    setMsalInstance(msalInstance) {
        this.msalInstance = msalInstance;
    }

    // Initiates sign-in flow
    async signIn(username) {
        try {
            Utilities.logMessage(`Starting sign-in process`, "info");

            if (!this.msalInstance) {
                throw new Error("MSAL not initialized. Cannot perform sign-in.");
            }

            const signInInputs = { username: username };

            const result = await this.msalInstance.signIn(signInInputs);
            return this.handleSignInResult(result);
        } catch (error) {
            Utilities.logMessage(`Sign-in error: ${error}`, "error");
            throw error;
        }
    }

    // Handles the result from sign-in operations and determines next steps
    handleSignInResult(result) {      
        // Check if sign-in is COMPLETED
        if (result.isCompleted()) {
            Utilities.logMessage("STATE: COMPLETED - Sign-in successful!", "success");
            const account = result.data;
            Utilities.logMessage(`User account successfully authenticated`, "info");
            return { success: true, account: account };
        }
        
        // 2. Check if sign-in FAILED
        if (result.isFailed()) {
            Utilities.logMessage("STATE: FAILED - Sign-in failed", "error");
            if (result.error) {
                Utilities.logMessage(`Error occurred during sign-in`, "error");
            }
            return { success: false, result: result, error: result.error.errorData, state: 'failed' };
        }
        
        // 3. Check if CODE is REQUIRED (OOB Challenge - Email/SMS verification)
        if (result.isCodeRequired()) {
            Utilities.logMessage("STATE: CODE_REQUIRED - Email/SMS verification code needed", "info");

            // Store the result for later use
            this.pendingSignInResult = result;

            return { success: false, result: result, state: 'code_required' };
        }
        
        // 4. Check if PASSWORD is REQUIRED
        if (result.isPasswordRequired()) {
            Utilities.logMessage("STATE: PASSWORD_REQUIRED - Password authentication needed", "info");

            // Store the result for later use
            this.pendingSignInResult = result;

            return { success: false, result: result, state: 'password_required' };
        }

        return { success: false, result: result, state: 'unknown' };
    }

    /**
     * Submits verification code for OTP authentication
     */
    async submitCode(code) {
        try {
            Utilities.logMessage("🔍 SIGNIN SERVICE: submitCode called", "info");
            
            if (!this.pendingSignInResult) {
                throw new Error("No pending sign-in operation found");
            }

            Utilities.logMessage(`Submitting verification code`, "info");

            // Submit the code using the pending result
            const result = await this.pendingSignInResult.state.submitCode(code);
            
            // Handle the result of code submission
            const finalResult = this.handleSignInResult(result);
            
            if (finalResult.success) {
                // Clear the pending result on success
                this.pendingSignInResult = null;
            }
            
            return finalResult;

        } catch (error) {
            Utilities.logMessage(`Code submission failed`, "error");
            Utilities.logMessage(`Submit code error: ${error}`, "error");
            return { success: false, error: error.message };
        }
    }

    /**
     * Resends verification code
     */
    async resendCode() {
        try {
            if (!this.pendingSignInResult) {
                throw new Error("No pending sign-in operation found");
            }

            Utilities.logMessage("Resending verification code...", "info");

            // Check if resend method is available
            if (this.pendingSignInResult.state.resendCode) {
                await this.pendingSignInResult.state.resendCode();
                Utilities.logMessage("Verification code resent successfully", "success");
                return { success: true };
            } else {
                throw new Error("Resend code method not available");
            }

        } catch (error) {
            Utilities.logMessage(`Failed to resend code`, "error");
            Utilities.logMessage(`Resend code error: ${error}`, "error");
            return { success: false, error: error.message };
        }
    }

    /**
     * Submits password for authentication
     */
    async submitPassword(password) {
        try {
            if (!this.pendingSignInResult) {
                throw new Error("No pending sign-in operation found");
            }

            Utilities.logMessage(`Submitting password for authentication...`, "info");

            // Submit the password using the pending result
            const result = await this.pendingSignInResult.state.submitPassword(password);
            
            // Handle the result of password submission
            const finalResult = this.handleSignInResult(result);
            
            if (finalResult.success) {
                // Clear the pending result on success
                this.pendingSignInResult = null;
            }
            
            return finalResult;

        } catch (error) {
            Utilities.logMessage(`Password submission failed`, "error");
            Utilities.logMessage(`Submit password error: ${error}`, "error");
            return { success: false, error: error.message };
        }
    }

    /**
     * Clears any pending sign-in operation
     */
    clearPendingOperation() {
        this.pendingSignInResult = null;
        Utilities.logMessage("Pending sign-in operation cleared", "info");
    }

    /**
     * Checks if there's a pending sign-in operation
     */
    hasPendingOperation() {
        return this.pendingSignInResult !== null;
    }
}
