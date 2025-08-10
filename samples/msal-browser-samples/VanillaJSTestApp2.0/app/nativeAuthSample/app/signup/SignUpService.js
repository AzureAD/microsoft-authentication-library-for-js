/*
 * Sign-Up Service for MSAL Native Auth Sample
 * 
 * This service handles all sign-up related authentication operations, including
 * user registration, code verification, and password handling. It provides a clean
 * interface for sign-up functionality separate from sign-in operations.
 */

import { Utilities } from '../utilities.js';

export class SignUpService {
    constructor(msalInstance) {
        this.msalInstance = msalInstance;
        this.pendingSignUpResult = null;
        this.currentUsername = null;
        this.currentPassword = null;
    }

    /**
     * Updates the MSAL instance
     * @param {Object} msalInstance - The new MSAL instance
     */
    setMsalInstance(msalInstance) {
        this.msalInstance = msalInstance;
    }

    /**
     * Initiates username-first sign-up flow
     * @param {string} username - The username/email for sign-up
     * @param {Object} attributes - Optional user attributes (firstName, lastName)
     * @returns {Promise<Object>} Sign-up result with success status and next steps
     */
    async signUp(username, attributes = {}) {
        try {
            if (!this.msalInstance) {
                throw new Error("MSAL instance not initialized");
            }

            if (!username) {
                throw new Error("Username is required");
            }

            Utilities.logMessage(`Starting sign-up process`, "info");

            // Store current username for potential later use
            this.currentUsername = username;

            // Prepare sign-up parameters
            const signUpParams = {
                username: username
            };

            // If attributes are provided, add them to the sign-up call
            if (attributes && (attributes.firstName || attributes.lastName || attributes.city || attributes.country)) {
                // Create attributes object as key-value pairs
                const userAttributes = {};
                
                if (attributes.firstName) {
                    userAttributes.givenName = attributes.firstName;
                }
                if (attributes.lastName) {
                    userAttributes.surname = attributes.lastName;
                }
                if (attributes.city) {
                    userAttributes.city = attributes.city;
                }
                if (attributes.country) {
                    userAttributes.country = attributes.country;
                }
                
                signUpParams.attributes = userAttributes;
                
                Utilities.logMessage(`Sign-up with additional attributes provided`, "info");
            }

            // Use MSAL native auth sign-up start
            const result = await this.msalInstance.signUp(signUpParams);

            return await this.handleSignUpResult(result);
        } catch (error) {
            Utilities.logMessage(`Sign-up failed: ${error.message}`, "error");
            return { success: false, error: error.message };
        }
    }

        /**
     * Handle the result from MSAL sign-up operations
     * @param {Object} result - The result from MSAL sign-up call
     * @returns {Promise<Object>} Processed result with success status and account info
     */
    async handleSignUpResult(result) {
        if (!result) {
            return { success: false, error: "No result received from sign-up operation" };
        }

        // 1. Check if sign-up FAILED
        if (result.isFailed()) {
            Utilities.logMessage("STATE: FAILED - Sign-up failed", "error");
            if (result.error) {
                Utilities.logMessage(`Error occurred during sign-up`, "error");
            }
            return { success: false, result: result, error: result.error.errorData, state: 'failed'};
        }
        
        // 2. Check if CODE is REQUIRED (Email verification)
        if (result.isCodeRequired && result.isCodeRequired()) {
            Utilities.logMessage("STATE: CODE_REQUIRED - Email verification code needed", "info");

            // Store the result for later use
            this.pendingSignUpResult = result;

            return {
                success: false, 
                result: result, 
                state: 'code_required',
                username: this.currentUsername
            };
        }
        
        // 3. Check if PASSWORD is REQUIRED (Progressive disclosure)
        if (result.isPasswordRequired && result.isPasswordRequired()) {
            Utilities.logMessage("STATE: PASSWORD_REQUIRED - Password needed for sign-up", "info");

            // Store the result for later use
            this.pendingSignUpResult = result;

            return { 
                success: false, 
                result: result, 
                state: 'password_required',
                username: this.currentUsername
            };
        }

        // 4. Check if additional ATTRIBUTES are REQUIRED
        if (result.isAttributesRequired && result.isAttributesRequired()) {
            Utilities.logMessage("STATE: ATTRIBUTES_REQUIRED - Additional attributes needed", "info");
            
            this.pendingSignUpResult = result;
            
            return { 
                success: false, 
                result: result, 
                state: 'attributes_required',
                username: this.currentUsername
            };
        }

        // 5. Check if sign-up is COMPLETE/SUCCESS
        if (result.isCompleted && result.isCompleted()) {
            Utilities.logMessage("STATE: SUCCESS - Sign-up completed successfully", "success");
            
            // Check if state has signIn method and call it for automatic sign-in after sign-up
            if (result.state && typeof result.state.signIn === 'function') {
                Utilities.logMessage("STATE: AUTO_SIGNIN - Attempting automatic sign-in after sign-up completion", "info");
                try {
                    const signInResult = await result.state.signIn();
                    Utilities.logMessage("STATE: AUTO_SIGNIN_SUCCESS - Automatic sign-in completed", "success");
                    
                    // Clear pending result on success
                    this.pendingSignUpResult = null;
                    
                    return {
                        success: true,
                        result: signInResult,
                        account: signInResult.data || result.data,
                        state: 'completed_with_signin',
                        username: this.currentUsername,
                        autoSignIn: true
                    };
                } catch (signInError) {
                    Utilities.logMessage(`STATE: AUTO_SIGNIN_FAILED - Automatic sign-in failed`, "warning");
                    // Fall back to regular completion without automatic sign-in
                }
            }
            
            // Clear pending result on success
            this.pendingSignUpResult = null;
            
            return {
                success: true,
                result: result,
                account: result.data,
                state: 'completed',
                username: this.currentUsername
            };
        }

        // Default case - unknown state
        Utilities.logMessage(`STATE: UNKNOWN - Unhandled result state encountered`, "warning");
        return { success: false, result: result, state: 'unknown' };
    }
    
    /**
     * Submits password for sign-up when required
     * @param {string} password - The password for sign-up
     * @returns {Promise<Object>} Password submission result
     */
    async submitPassword(password) {
        try {
            if (!this.pendingSignUpResult) {
                throw new Error("No pending sign-up operation found");
            }

            if (!password) {
                throw new Error("Password is required");
            }

            Utilities.logMessage(`Submitting password for sign-up...`, "info");

            // Store password for potential later use
            this.currentPassword = password;

            // Submit the password using the pending result
            const result = await this.pendingSignUpResult.state.submitPassword(password);
            
            // Handle the result of password submission
            const finalResult = await this.handleSignUpResult(result);
            
            if (finalResult.success) {
                // Clear the pending result on success
                this.pendingSignUpResult = null;
            }
            
            return finalResult;

        } catch (error) {
            Utilities.logMessage(`Password submission failed: ${error.message}`, "error");
            return { success: false, error: error.message };
        }
    }



    /**
     * Submits verification code for email verification during sign-up
     * @param {string} code - The verification code received via email
     * @returns {Promise<Object>} Verification result
     */
    async submitCode(code) {
        try {
            Utilities.logMessage("🔍 SIGNUP SERVICE: submitCode called", "info");
            
            if (!this.pendingSignUpResult) {
                throw new Error("No pending sign-up operation found");
            }

            if (!code) {
                throw new Error("Verification code is required");
            }

            Utilities.logMessage(`Submitting verification code`, "info");
            // Submit the code using the pending result
            const result = await this.pendingSignUpResult.state.submitCode(code);
            
            // Handle the result of code submission
            const finalResult = await this.handleSignUpResult(result);
            
            if (finalResult.success) {
                // Clear the pending result on success
                this.pendingSignUpResult = null;
            }
            
            return finalResult;

        } catch (error) {
            Utilities.logMessage(`Code submission failed: ${error.message}`, "error");
            return { success: false, error: error.message };
        }
    }

    /**
     * Resends verification code for email verification
     * @returns {Promise<Object>} Resend operation result
     */
    async resendCode() {
        try {
            if (!this.pendingSignUpResult) {
                throw new Error("No pending sign-up operation found");
            }

            Utilities.logMessage("Resending verification code...", "info");

            // Check if resend method is available
            if (this.pendingSignUpResult.state.resendCode) {
                await this.pendingSignUpResult.state.resendCode();
                Utilities.logMessage("Verification code resent successfully", "success");
                return { success: true };
            } else {
                throw new Error("Resend code method not available");
            }

        } catch (error) {
            Utilities.logMessage(`Failed to resend code: ${error.message}`, "error");
            return { success: false, error: error.message, state: 'resend_failed' };
        }
    }

    /**
     * Submits additional attributes if required during sign-up
     * @param {Object} attributes - The required attributes
     * @returns {Promise<Object>} Attribute submission result
     */
    async submitAttributes(attributes) {
        try {
            if (!this.pendingSignUpResult) {
                throw new Error("No pending sign-up operation found");
            }

            if (!attributes) {
                throw new Error("Attributes are required");
            }

            Utilities.logMessage("Submitting additional attributes...", "info");

            // Submit the attributes using the pending result
            const result = await this.pendingSignUpResult.state.submitAttributes(attributes);
            
            // Handle the result of attribute submission
            const finalResult = this.handleSignUpResult(result);
            
            if (finalResult.success) {
                // Clear the pending result on success
                this.pendingSignUpResult = null;
            }
            
            return finalResult;

        } catch (error) {
            Utilities.logMessage(`Attribute submission failed: ${error.message}`, "error");
            return { success: false, error: error.message };
        }
    }

    /**
     * Clears any pending sign-up operation
     */
    clearPendingOperation() {
        this.pendingSignUpResult = null;
        this.currentUsername = null;
        this.currentPassword = null;
        Utilities.logMessage("Pending sign-up operation cleared", "info");
    }

    /**
     * Checks if there's a pending sign-up operation
     */
    hasPendingOperation() {
        return this.pendingSignUpResult !== null;
    }

    /**
     * Gets the current username being used for sign-up
     * @returns {string|null} The current username or null if not set
     */
    getCurrentUsername() {
        return this.currentUsername;
    }
}
