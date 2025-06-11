/*
 * Reset Password UI Manager for MSAL Native Auth Sample
 * 
 * This module handles all password reset related UI interactions, form submissions, and DOM manipulation.
 * It manages the email input form, code verification, and new password submission following the same
 * pattern as the SignUpUIManager.
 */

import { Utilities } from "../utilities.js";
import uiManager from "../ui.js";

export class ResetPasswordUIManager {
    constructor(resetPasswordService) {
        this.resetPasswordService = resetPasswordService;
        this.eventListenersInitialized = false;
        this.currentContext = null; // Track current context (resetPassword)
        this.boundHandlers = new Map(); // Store bound event handlers for cleanup
        this.activeListeners = new Map(); // Track active event listeners by element and event type
        
        // Initialize event listeners when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeEventListeners();
            });
        } else {
            // DOM is already ready
            this.initializeEventListeners();
        }
    }

    /**
     * Update the reset password service reference
     */
    setResetPasswordService(resetPasswordService) {
        this.resetPasswordService = resetPasswordService;
    }

    /**
     * Initialize all reset password related event listeners
     */
    initializeEventListeners() {
        if (this.eventListenersInitialized) {
            return;
        }

        Utilities.logMessage('Initializing ResetPasswordUIManager event listeners...', 'info');

        // Bind handlers to maintain proper 'this' context
        const resetPasswordFormHandler = (e) => this.handleResetPasswordSubmit(e);
        const resetPasswordCodeFormHandler = (e) => this.handleResetPasswordCodeSubmit(e);
        const resetPasswordNewPasswordFormHandler = (e) => this.handleResetPasswordNewPasswordSubmit(e);
        const showResetPasswordHandler = (e) => this.showResetPasswordForm(e);

        // Store bound handlers for cleanup
        this.boundHandlers.set('resetPasswordForm', resetPasswordFormHandler);
        this.boundHandlers.set('resetPasswordCodeForm', resetPasswordCodeFormHandler);
        this.boundHandlers.set('resetPasswordNewPasswordForm', resetPasswordNewPasswordFormHandler);
        this.boundHandlers.set('showResetPassword', showResetPasswordHandler);

        // Add event listeners with tracking
        this.addEventListenerWithTracking('resetPasswordForm', 'submit', resetPasswordFormHandler);
        this.addEventListenerWithTracking('resetPasswordCodeForm', 'submit', resetPasswordCodeFormHandler);
        this.addEventListenerWithTracking('resetPasswordNewPasswordForm', 'submit', resetPasswordNewPasswordFormHandler);
        this.addEventListenerWithTracking('showResetPasswordBtn', 'click', showResetPasswordHandler);

        this.eventListenersInitialized = true;
        Utilities.logMessage('ResetPasswordUIManager event listeners initialized successfully', 'success');
    }

    /**
     * Add event listener with tracking for easy cleanup
     */
    addEventListenerWithTracking(elementId, eventType, handler) {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(eventType, handler);
            
            // Track the listener for cleanup
            const key = `${elementId}_${eventType}`;
            this.activeListeners.set(key, { element, eventType, handler });
            
            Utilities.logMessage(`Event listener attached: ${elementId} (${eventType})`, 'info');
        } else {
            Utilities.logMessage(`Element not found: ${elementId}`, 'warning');
        }
    }

    /**
     * Remove event listener and stop tracking
     */
    removeEventListenerWithTracking(elementId, eventType) {
        const key = `${elementId}_${eventType}`;
        const listenerInfo = this.activeListeners.get(key);
        
        if (listenerInfo) {
            listenerInfo.element.removeEventListener(listenerInfo.eventType, listenerInfo.handler);
            this.activeListeners.delete(key);
            Utilities.logMessage(`Event listener removed: ${elementId} (${eventType})`, 'info');
        }
    }

    /**
     * Handle reset password form submission (Step 1: Email input)
     */
    async handleResetPasswordSubmit(event) {
        event.preventDefault();
        
        Utilities.logMessage('🔍 RESET PASSWORD UI: handleResetPasswordSubmit called', 'info');
        
        try {
            const emailInput = document.getElementById('resetPasswordEmail');
            const email = emailInput ? emailInput.value.trim() : '';
            
            if (!email) {
                this.displayMessage('Please enter your email address', 'error');
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                this.displayMessage('Please enter a valid email address', 'error');
                return;
            }
            
            this.displayMessage('Starting password reset...', 'info');
            this.disableFormInputs('resetPasswordForm');
            
            // Call the reset password service
            const result = await this.resetPasswordService.resetPassword(email);
            
            Utilities.logMessage('Reset password result received', 'info');
            
            if (result.success) {
                this.displayMessage('Password reset completed successfully!', 'success');
                this.showSignInForm();
            } else if (result.state === 'code_required') {
                this.displayMessage('Verification code sent to your email. Please check your inbox.', 'success');
                this.showResetPasswordCodeForm();
            } else {
                const errorMessage = result.error || 'Password reset failed. Please try again.';
                this.displayMessage(errorMessage, 'error');
            }
            
        } catch (error) {
            Utilities.logMessage(`Reset password error: ${error}`, 'error');
            this.displayMessage('An unexpected error occurred. Please try again.', 'error');
        } finally {
            this.enableFormInputs('resetPasswordForm');
        }
    }

    /**
     * Handle reset password code form submission (Step 2: Code verification)
     */
    async handleResetPasswordCodeSubmit(event) {
        event.preventDefault();
        
        Utilities.logMessage('🔍 RESET PASSWORD UI: handleResetPasswordCodeSubmit called', 'info');
        
        try {
            const codeInput = document.getElementById('resetPasswordCode');
            const code = codeInput ? codeInput.value.trim() : '';
            
            if (!code) {
                this.displayMessage('Please enter the verification code', 'error');
                return;
            }

            // Validate code format (8 digits)
            if (!/^\d{8}$/.test(code)) {
                this.displayMessage('Verification code must be 8 digits', 'error');
                return;
            }
            
            this.displayMessage('Verifying code...', 'info');
            this.disableFormInputs('resetPasswordCodeForm');
            
            // Submit the verification code
            const result = await this.resetPasswordService.submitCode(code);
            
            Utilities.logMessage('Code verification result received', 'info');
            
            if (result.success) {
                this.displayMessage('Password reset completed successfully!', 'success');
                this.showSignInForm();
            } else if (result.state === 'password_required') {
                this.displayMessage('Code verified! Please enter your new password.', 'success');
                this.showResetPasswordNewPasswordForm();
            } else {
                const errorMessage = result.error || 'Code verification failed. Please try again.';
                this.displayMessage(errorMessage, 'error');
            }
            
        } catch (error) {
            Utilities.logMessage(`Code verification error: ${error}`, 'error');
            this.displayMessage('An unexpected error occurred. Please try again.', 'error');
        } finally {
            this.enableFormInputs('resetPasswordCodeForm');
        }
    }

    /**
     * Handle reset password new password form submission (Step 3: New password submission)
     */
    async handleResetPasswordNewPasswordSubmit(event) {
        event.preventDefault();
        
        Utilities.logMessage('🔍 RESET PASSWORD UI: handleResetPasswordNewPasswordSubmit called', 'info');
        
        try {
            const passwordInput = document.getElementById('resetPasswordNewPassword');
            const password = passwordInput ? passwordInput.value : '';
            
            if (!password) {
                this.displayMessage('Please enter a new password', 'error');
                return;
            }

            // Basic password validation
            if (password.length < 8) {
                this.displayMessage('Password must be at least 8 characters long', 'error');
                return;
            }
            
            this.displayMessage('Setting new password...', 'info');
            this.disableFormInputs('resetPasswordNewPasswordForm');
            
            // Submit the new password
            const result = await this.resetPasswordService.submitPassword(password);
            
            Utilities.logMessage('🔍 RESET PASSWORD UI: Password submission result received', 'info');
            
            if (result.success && result.autoSignIn && result.state === 'completed_with_signin') {
                // Password reset completed with automatic sign-in
                Utilities.logMessage("🔍 RESET PASSWORD UI: Password reset completed with automatic sign-in", "success");
                Utilities.logMessage("🔍 RESET PASSWORD UI: Account info from password reset received", "info");
                
                // Notify main UI manager about successful reset password and sign-in
                if (uiManager && uiManager.updateAccountInfo) {
                    Utilities.logMessage("🔍 RESET PASSWORD UI: Updating account info after password reset", "info");
                    uiManager.updateAccountInfo(result.account);

                    Utilities.logMessage("🔍 RESET PASSWORD UI: Account info updated successfully after password reset", "success");
                } else {
                    Utilities.logMessage("🔍 RESET PASSWORD UI: uiManager or updateAccountInfo method not available after password reset", "warning");
                }
                
                // Hide the new password form and return to main reset password form
                this.hideNewPasswordForm();
                
                // Clear the form on success
                event.target.reset();
                
            } else if (result.success) {
                // Password reset completed successfully but without auto sign-in
                this.displayMessage('Password reset completed successfully! You can now sign in with your new password.', 'success');
                this.showSignInForm();
            } else {
                const errorMessage = result.error || 'Password reset failed. Please try again.';
                this.displayMessage(errorMessage, 'error');
            }
            
        } catch (error) {
            Utilities.logMessage(`Password submission error: ${error}`, 'error');
            this.displayMessage('An unexpected error occurred. Please try again.', 'error');
        } finally {
            this.enableFormInputs('resetPasswordNewPasswordForm');
        }
    }

    /**
     * Show the reset password form (Step 1)
     */
    showResetPasswordForm() {
        Utilities.logMessage('Showing reset password form', 'info');
        
        // Hide other forms
        this.hideAllForms();
        
        // Show reset password form
        const resetPasswordDiv = document.getElementById('resetPasswordCard');
        if (resetPasswordDiv) {
            resetPasswordDiv.style.display = 'block';
            this.clearFormInputs('resetPasswordForm');
            this.clearMessages();
            
            // Focus on email input
            const emailInput = document.getElementById('resetPasswordEmail');
            if (emailInput) {
                setTimeout(() => emailInput.focus(), 100);
            }
        }
    }

    /**
     * Show the reset password code verification form (Step 2)
     */
    showResetPasswordCodeForm() {
        Utilities.logMessage('Showing reset password code verification form', 'info');
        
        // Hide other forms
        this.hideAllForms();
        
        // Show code verification form
        const codeVerificationDiv = document.getElementById('resetPasswordCodeCard');
        if (codeVerificationDiv) {
            codeVerificationDiv.style.display = 'block';
            this.clearFormInputs('resetPasswordCodeForm');
            
            // Focus on code input
            const codeInput = document.getElementById('resetPasswordCode');
            if (codeInput) {
                setTimeout(() => codeInput.focus(), 100);
            }
        }
    }

    /**
     * Show the reset password new password form (Step 3)
     */
    showResetPasswordNewPasswordForm() {
        Utilities.logMessage('Showing reset password new password form', 'info');
        
        // Hide other forms
        this.hideAllForms();
        
        // Show password submission form
        const passwordSubmissionDiv = document.getElementById('resetPasswordNewPasswordCard');
        if (passwordSubmissionDiv) {
            passwordSubmissionDiv.style.display = 'block';
            this.clearFormInputs('resetPasswordNewPasswordForm');
            
            // Focus on password input
            const passwordInput = document.getElementById('resetPasswordNewPassword');
            if (passwordInput) {
                setTimeout(() => passwordInput.focus(), 100);
            }
        }
    }

    /**
     * Show the sign-in form
     */
    showSignInForm() {
        Utilities.logMessage('Showing sign-in form', 'info');
        
        // Hide all forms
        this.hideAllForms();
        
        // Show sign-in form
        const signInDiv = document.getElementById('signInDiv');
        if (signInDiv) {
            signInDiv.style.display = 'block';
        }
        
        // Clear any pending operations
        if (this.resetPasswordService) {
            this.resetPasswordService.clearPendingOperation();
        }
    }

    /**
     * Hide all forms
     */
    hideAllForms() {
        const forms = [
            'signInDiv',
            'signUpDiv', 
            'resetPasswordCard',
            'resetPasswordCodeCard',
            'resetPasswordNewPasswordCard',
            'signUpPasswordCard',
            'codeVerificationCard',
            'passwordInputCard',
            'welcomeDiv'
        ];
        
        forms.forEach(formId => {
            const form = document.getElementById(formId);
            if (form) {
                form.style.display = 'none';
            }
        });
    }

    /**
     * Display a message to the user
     */
    displayMessage(message, type = 'info') {
        Utilities.logMessage(`Reset Password UI Message (${type}): ${message}`, type);
        
        // For error messages, use the global error banner
        if (type === 'error') {
            uiManager.showErrorBanner(message, 'resetpassword');
            return;
        }
        
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `message ${type}`;
            messageElement.style.display = 'block';
            
            Utilities.logMessage(message, type);
        }
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        const messageElement = document.getElementById('message');
        if (messageElement) {
            messageElement.textContent = '';
            messageElement.className = 'message';
            messageElement.style.display = 'none';
        }
    }

    /**
     * Clear form inputs
     */
    clearFormInputs(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('input');
            inputs.forEach(input => {
                input.value = '';
            });
        }
    }

    /**
     * Disable form inputs
     */
    disableFormInputs(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('input, button');
            inputs.forEach(input => {
                input.disabled = true;
            });
        }
    }

    /**
     * Enable form inputs
     */
    enableFormInputs(formId) {
        const form = document.getElementById(formId);
        if (form) {
            const inputs = form.querySelectorAll('input, button');
            inputs.forEach(input => {
                input.disabled = false;
            });
        }
    }

    /**
     * Handle resend code button click
     */
    async handleResendCode() {
        try {
            this.displayMessage('Resending verification code...', 'info');
            
            const result = await this.resetPasswordService.resendCode();
            
            if (result.success) {
                this.displayMessage('Verification code resent successfully. Please check your email.', 'success');
            } else {
                this.displayMessage('Failed to resend code. Please try again.', 'error');
            }
        } catch (error) {
            Utilities.logMessage(`Resend code error: ${error}`, 'error');
            this.displayMessage('An unexpected error occurred. Please try again.', 'error');
        }
    }

    /**
     * Hide the new password form and return to main reset password form
     * Similar to hidePasswordInputForm() in SignUpUIManager.js
     */
    hideNewPasswordForm() {
        const resetPasswordNewPasswordCard = document.getElementById('resetPasswordNewPasswordCard');
        if (resetPasswordNewPasswordCard) resetPasswordNewPasswordCard.style.display = 'none';
        
        // Clear the password input
        const passwordInput = document.getElementById('resetPasswordNewPassword');
        if (passwordInput) {
            passwordInput.value = '';
        }
        
        // Show reset password form again to allow users to start the flow again
        this.showResetPasswordForm();
    }

    /**
     * Show success message for automatic sign-in after password reset
     */
    showResetPasswordSuccessWithSignIn(username) {
        Utilities.logMessage(`🔍 RESET PASSWORD UI: Password reset and automatic sign-in successful for ${username}`, 'success');
        
        // Do NOT hide reset password forms - keep them visible after successful completion
        // This matches the behavior pattern from signup flow where forms remain visible
        
        // Show a success message indicating automatic sign-in
        this.displayMessage(`Password reset completed successfully! You have been automatically signed in as ${username}.`, 'success');
        
        // Optional: You could also show a welcome message or redirect to a specific page
        // For now, we'll rely on the main UI manager to update the account information
    }

    /**
     * Hide all reset password forms
     */
    hideAllResetPasswordForms() {
        const resetPasswordCard = document.getElementById('resetPasswordCard');
        const resetPasswordCodeCard = document.getElementById('resetPasswordCodeCard');
        const resetPasswordNewPasswordCard = document.getElementById('resetPasswordNewPasswordCard');
        
        if (resetPasswordCard) resetPasswordCard.style.display = 'none';
        if (resetPasswordCodeCard) resetPasswordCodeCard.style.display = 'none';
        if (resetPasswordNewPasswordCard) resetPasswordNewPasswordCard.style.display = 'none';
    }

    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        // Remove all tracked event listeners
        for (const [key, listenerInfo] of this.activeListeners) {
            listenerInfo.element.removeEventListener(listenerInfo.eventType, listenerInfo.handler);
        }
        
        this.activeListeners.clear();
        this.boundHandlers.clear();
        this.eventListenersInitialized = false;
        
        Utilities.logMessage('ResetPasswordUIManager cleaned up', 'info');
    }
}
