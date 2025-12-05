/*
 * Sign-Up UI Manager for MSAL Native Auth Sample
 * 
 * This module handles all sign-up related UI interactions, form submissions, and DOM manipulation
 * extracted from the SignInUIManager. It manages the sign-up forms, code verification, and attribute input.
 */

import { Utilities } from "../utilities.js";
import uiManager from "../ui.js";

export class SignUpUIManager {
    constructor(signUpService) {
        this.signUpService = signUpService;
        this.eventListenersInitialized = false;
        this.currentContext = null; // Track current context (signup/signin)
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
     * Update the sign-up service reference
     */
    setSignUpService(signUpService) {
        this.signUpService = signUpService;
    }

    /**
     * Initialize all sign-up related event listeners
     */
    initializeEventListeners() {
        if (this.eventListenersInitialized) {
            return;
        }

        Utilities.logMessage('Initializing SignUpUIManager event listeners...', 'info');

        // Bind handlers to maintain proper 'this' context
        const signUpFormHandler = (e) => this.handleSignUpSubmit(e);
        const showSignUpHandler = (e) => this.showSignUpForm(e);

        // Store bound handlers for cleanup
        this.boundHandlers.set('signUpForm', signUpFormHandler);
        this.boundHandlers.set('showSignUp', showSignUpHandler);

        // Add event listeners with tracking
        this.addEventListenerWithTracking('signUpForm', 'submit', signUpFormHandler);
        this.addEventListenerWithTracking('showSignUpBtn', 'click', showSignUpHandler);

        this.eventListenersInitialized = true;
        Utilities.logMessage('SignUpUIManager event listeners initialized successfully', 'success');
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
     * Set up context-specific handlers for code verification
     */
    setupCodeVerificationHandlers(context) {
        this.currentContext = context;
        
        // Remove existing code verification handlers
        this.removeEventListenerWithTracking('codeVerificationForm', 'submit');
        this.removeEventListenerWithTracking('resendCodeBtn', 'click');
        this.removeEventListenerWithTracking('cancelCodeBtn', 'click');

        // Add context-specific handlers
        if (context === 'signup') {
            const codeFormHandler = (e) => this.handleSignUpCodeSubmit(e);
            const resendCodeHandler = (e) => this.handleSignUpResendCode(e);
            const cancelCodeHandler = (e) => this.handleSignUpCancelCode(e);

            this.boundHandlers.set('codeForm_signup', codeFormHandler);
            this.boundHandlers.set('resendCode_signup', resendCodeHandler);
            this.boundHandlers.set('cancelCode_signup', cancelCodeHandler);

            this.addEventListenerWithTracking('codeVerificationForm', 'submit', codeFormHandler);
            this.addEventListenerWithTracking('resendCodeBtn', 'click', resendCodeHandler);
            this.addEventListenerWithTracking('cancelCodeBtn', 'click', cancelCodeHandler);
        }
    }

    /**
     * Clean up event listeners to prevent memory leaks
     */
    cleanup() {
        // Remove all tracked event listeners
        for (const [key, listenerInfo] of this.activeListeners) {
            listenerInfo.element.removeEventListener(listenerInfo.eventType, listenerInfo.handler);
        }

        this.activeListeners.clear();
        this.boundHandlers.clear();
        this.eventListenersInitialized = false;
        this.currentContext = null;
        Utilities.logMessage('SignUpUIManager cleanup completed', 'info');
    }

    // Navigation Methods
    showSignUpForm() {
        const showSignInBtn = document.getElementById('showSignInBtn');
        const showSignUpBtn = document.getElementById('showSignUpBtn');
        const signInCard = document.getElementById('signInCard');
        const signUpCard = document.getElementById('signUpCard');
        const codeVerificationCard = document.getElementById('codeVerificationCard');
        const passwordInputCard = document.getElementById('passwordInputCard');

        // Update button states
        if (showSignInBtn) showSignInBtn.classList.remove('active');
        if (showSignUpBtn) showSignUpBtn.classList.add('active');

        // Show sign-up form, hide other forms
        if (signInCard) signInCard.style.display = 'none';
        if (signUpCard) signUpCard.style.display = 'block';
        if (codeVerificationCard) codeVerificationCard.style.display = 'none';
        if (passwordInputCard) passwordInputCard.style.display = 'none';

        this.clearSignUpForm();
    }

    clearSignUpForm() {
        const signUpForm = document.getElementById('signUpForm');
        if (signUpForm) {
            signUpForm.reset();
        }
    }

    showCodeVerificationForm(username, context = 'signup') {
        const signInCard = document.getElementById('signInCard');
        const signUpCard = document.getElementById('signUpCard');
        const codeVerificationCard = document.getElementById('codeVerificationCard');
        const passwordInputCard = document.getElementById('passwordInputCard');
        const codeInstructions = document.getElementById('codeInstructions');

        // Hide other forms
        if (signInCard) signInCard.style.display = 'none';
        if (signUpCard) signUpCard.style.display = 'none';
        if (passwordInputCard) passwordInputCard.style.display = 'none';

        // Update instructions with username and context
        if (codeInstructions) {
            const message = context === 'signup' 
                ? `A verification code has been sent to ${username}. Please check your email and enter the code below to complete your registration:`
                : `A verification code has been sent to ${username}. Please check your email and enter the code below:`;
            codeInstructions.textContent = message;
        }

        // Show code verification form
        if (codeVerificationCard) codeVerificationCard.style.display = 'block';

        // Set up context-specific event handlers
        this.setupCodeVerificationHandlers(context);

        // Focus on the code input field
        const verificationCodeInput = document.getElementById('verificationCode');
        if (verificationCodeInput) {
            setTimeout(() => verificationCodeInput.focus(), 100);
        }
    }

    hideCodeVerificationForm() {
        const codeVerificationCard = document.getElementById('codeVerificationCard');
        if (codeVerificationCard) codeVerificationCard.style.display = 'none';
        
        // Clear the verification code input
        const verificationCodeInput = document.getElementById('verificationCode');
        if (verificationCodeInput) {
            verificationCodeInput.value = '';
        }
        
        // Remove context-specific handlers
        this.removeEventListenerWithTracking('codeVerificationForm', 'submit');
        this.removeEventListenerWithTracking('resendCodeBtn', 'click');
        this.removeEventListenerWithTracking('cancelCodeBtn', 'click');
        this.currentContext = null;
        
        // Show sign-up form again
        this.showSignUpForm();
    }

    // Form Handlers
    async handleSignUpSubmit(event) {
        event.preventDefault();
        
        const signUpBtn = document.getElementById('signUpBtn');
        const originalText = signUpBtn ? signUpBtn.textContent : 'Sign Up';
        
        try {
            // Show loading state
            if (signUpBtn) this.setButtonLoading(signUpBtn, 'Signing up...');
            
            // Get form data
            const formData = new FormData(event.target);
            const username = formData.get('username');
            const firstName = formData.get('firstName');
            const lastName = formData.get('lastName');
            const city = formData.get('city');
            const country = formData.get('country');

            if (!username) {
                throw new Error("Username is required");
            }

            if (!this.signUpService) {
                throw new Error("Sign-up service not available");
            }

            // Prepare attributes if any user attributes are provided
            const attributes = {};
            if (firstName) attributes.firstName = firstName;
            if (lastName) attributes.lastName = lastName;
            if (city) attributes.city = city;
            if (country) attributes.country = country;

            Utilities.logMessage("Processing sign-up form submission...", "info");

            // Call the username-first sign-up method (progressive disclosure)
            const result = await this.signUpService.signUp(username, attributes);

            if (result.state === 'code_required') {
                // Show code verification form for email verification
                this.showCodeVerificationForm(username, 'signup');
                
            } else if (result.state === 'password_required') {
                // Show password input form (progressive disclosure)
                this.showPasswordInputForm(username);
                
            } else if (result.state === 'attributes_required') {
                // Show additional attributes form (if needed)
                this.showAttributesForm(result.result);
                
            } else if (result.state === 'failed') {
                // Handle sign-up failure
                Utilities.logMessage(`Sign-up failed: ${result.error || 'Unknown error'}`, "error");
                this.showSignUpError(result.error || 'Sign-up failed. Please try again.');
            } else {
                // Handle other failure cases
                Utilities.logMessage(`Sign-up failed`, "error");
                this.showSignUpError('Sign-up failed. Please try again.');
            }

        } catch (error) {
            Utilities.logMessage("Sign-up error occurred: " + (error.message || "Unknown error"), "error");
            this.showSignUpError('An error occurred. Please try again.');
        } finally {
            if (signUpBtn) this.resetButton(signUpBtn, originalText);
        }
    }

    async handleSignUpCodeSubmit(event) {
        event.preventDefault();
        
        Utilities.logMessage("🔍 SIGNUP UI MANAGER: handleSignUpCodeSubmit called", "info");
        
        const submitCodeBtn = document.getElementById('submitCodeBtn');
        const originalText = submitCodeBtn ? submitCodeBtn.textContent : 'Verify Code';
        
        try {
            // Show loading state
            if (submitCodeBtn) this.setButtonLoading(submitCodeBtn, 'Verifying...');
            
            // Get form data
            const formData = new FormData(event.target);
            const code = formData.get('code');

            if (!code) {
                throw new Error("Verification code is required");
            }

            if (!this.signUpService) {
                throw new Error("Sign-up service not available");
            }

            // Call the code submission method
            const result = await this.signUpService.submitCode(code);
            
            if (result.success && result.state === 'completed_with_signin') {
                // Code verification successful and sign-up completed with automatic sign-in
                Utilities.logMessage("🔍 SIGNUP UI: Code verification completed with automatic sign-in", "success");
                
                if (uiManager && uiManager.updateAccountInfo) {
                    Utilities.logMessage("🔍 SIGNUP UI: Updating account info after code verification", "info");
                    uiManager.updateAccountInfo(result.account);

                    Utilities.logMessage("🔍 SIGNUP UI: Account info updated successfully after code verification", "success");
                } else {
                    Utilities.logMessage("🔍 SIGNUP UI: uiManager or updateAccountInfo method not available after code verification", "warning");
                }
                
                this.hideCodeVerificationForm();
                
                // Clear the form on success
                event.target.reset();
                
            } else if (result.state === 'password_required') {
                // Code verification successful, but password is now required
                Utilities.logMessage("🔍 SIGNUP UI: Code verified successfully, password now required", "info");
                
                this.hideCodeVerificationForm();
                
                // Clear the form
                event.target.reset();
                
                // Show password input form for sign-up
                this.showPasswordInputForm(this.signUpService.getCurrentUsername());
                
            } else if (result.state === 'attributes_required') {
                // Code verification successful, but additional attributes required
                Utilities.logMessage("Code verified successfully, attributes now required", "info");
                
                this.hideCodeVerificationForm();
                
                // Clear the form
                event.target.reset();
                
                // Show attributes form (if implemented)
                this.showAttributesForm(result.result);
                
            } else {
                // Handle verification failure
                this.showCodeVerificationError(result.error || 'Code verification failed. Please try again.');
            }

        } catch (error) {
            Utilities.logMessage("Code verification error occurred: " + (error.message || "Unknown error"), "error");
            this.showCodeVerificationError(error.message);
        } finally {
            if (submitCodeBtn) this.resetButton(submitCodeBtn, originalText);
        }
    }

    async handleSignUpResendCode() {
        const resendCodeBtn = document.getElementById('resendCodeBtn');
        const originalText = resendCodeBtn ? resendCodeBtn.textContent : 'Resend Code';
        
        try {
            // Show loading state
            if (resendCodeBtn) this.setButtonLoading(resendCodeBtn, 'Resending...');
            
            if (!this.signUpService) {
                throw new Error("Sign-up service not available");
            }

            // Call the resend code method
            const result = await this.signUpService.resendCode();
            
            if (result.success) {
                Utilities.logMessage("Verification code resent successfully", "success");
                this.showCodeResendSuccess();
            } else {
                throw new Error("Failed to resend verification code");
            }

        } catch (error) {
            Utilities.logMessage("Resend code error occurred: " + (error.message || "Unknown error"), "error");
            this.showCodeResendError(error.message);
        } finally {
            if (resendCodeBtn) this.resetButton(resendCodeBtn, originalText);
        }
    }

    handleSignUpCancelCode() {
        // Hide the code verification form and return to sign-up
        this.hideCodeVerificationForm();
        Utilities.logMessage("Sign-up code verification cancelled", "info");
        
        // Clear any pending operations
        if (this.signUpService) {
            this.signUpService.clearPendingOperation();
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

    clearSignUpForm() {
        const signUpForm = document.getElementById('signUpForm');
        if (signUpForm) {
            signUpForm.reset();
        }
    }

    showPasswordInputForm(username) {
        const signUpCard = document.getElementById('signUpCard');
        const signUpPasswordCard = document.getElementById('signUpPasswordCard');
        const codeVerificationCard = document.getElementById('codeVerificationCard');
        const passwordInstructions = document.getElementById('signUpPasswordInstructions');

        // Hide other forms
        if (signUpCard) signUpCard.style.display = 'none';
        if (codeVerificationCard) codeVerificationCard.style.display = 'none';

        // Update instructions with username
        if (passwordInstructions) {
            passwordInstructions.textContent = `Please create a password for ${username} to complete sign-up:`;
        }

        // Show password input form
        if (signUpPasswordCard) signUpPasswordCard.style.display = 'block';

        // Set up password form event listeners
        this.setupPasswordFormHandlers();

        // Focus on the password input field
        const passwordInput = document.getElementById('signUpPassword');
        if (passwordInput) {
            setTimeout(() => passwordInput.focus(), 100);
        }
    }

    hidePasswordInputForm() {
        const signUpPasswordCard = document.getElementById('signUpPasswordCard');
        if (signUpPasswordCard) signUpPasswordCard.style.display = 'none';
        
        // Clear the password input
        const passwordInput = document.getElementById('signUpPassword');
        if (passwordInput) {
            passwordInput.value = '';
        }
        
        // Remove password form handlers
        this.removePasswordFormHandlers();
        
        // Show sign-up form again
        this.showSignUpForm();
    }

    setupPasswordFormHandlers() {
        // Remove existing handlers first
        this.removePasswordFormHandlers();

        // Add password form submit handler
        const passwordFormHandler = (e) => this.handlePasswordSubmit(e);
        const cancelPasswordHandler = (e) => this.handleCancelPassword(e);

        this.boundHandlers.set('signUpPasswordForm', passwordFormHandler);
        this.boundHandlers.set('cancelSignUpPassword', cancelPasswordHandler);

        this.addEventListenerWithTracking('signUpPasswordForm', 'submit', passwordFormHandler);
        this.addEventListenerWithTracking('cancelSignUpPasswordBtn', 'click', cancelPasswordHandler);
    }

    removePasswordFormHandlers() {
        this.removeEventListenerWithTracking('signUpPasswordForm', 'submit');
        this.removeEventListenerWithTracking('cancelSignUpPasswordBtn', 'click');
        
        this.boundHandlers.delete('signUpPasswordForm');
        this.boundHandlers.delete('cancelSignUpPassword');
    }

    async handlePasswordSubmit(event) {
        event.preventDefault();
        
        Utilities.logMessage("🔍 SIGNUP UI: handlePasswordSubmit called", "info");
        
        const submitPasswordBtn = document.getElementById('submitSignUpPasswordBtn');
        const originalText = submitPasswordBtn ? submitPasswordBtn.textContent : 'Create Account';
        
        try {
            // Show loading state
            if (submitPasswordBtn) this.setButtonLoading(submitPasswordBtn, 'Creating account...');
            
            // Get form data
            const formData = new FormData(event.target);
            const password = formData.get('password');

            if (!password) {
                throw new Error("Password is required");
            }

            if (!this.signUpService) {
                throw new Error("Sign-up service not available");
            }

            // Call the password submission method
            const result = await this.signUpService.submitPassword(password);
            
            if (result.success && result.state === 'completed_with_signin') {
                // Password accepted and sign-up completed with automatic sign-in
                Utilities.logMessage("🔍 SIGNUP UI: Password submission completed with automatic sign-in", "success");
                
                // Notify main UI manager about successful sign-up and sign-in
                if (uiManager && uiManager.updateAccountInfo) {
                    Utilities.logMessage("🔍 SIGNUP UI: Updating account info after password submission", "info");
                    uiManager.updateAccountInfo(result.account);

                    Utilities.logMessage("🔍 SIGNUP UI: Account info updated successfully after password submission", "success");
                } else {
                    Utilities.logMessage("🔍 SIGNUP UI: uiManager or updateAccountInfo method not available after password submission", "warning");
                }
                this.hidePasswordInputForm();
                
                // Clear the form on success
                event.target.reset();
                
            } else {
                // Handle password submission failure
                Utilities.logMessage(`Password submission failed: ${result.error || 'Unknown error'}`, "error");
                this.showSignUpError('Password submission failed. Please try again.');
            }

        } catch (error) {
            Utilities.logMessage("Password submission error: " + (error.message || "Unknown error"), "error");
            this.showSignUpError(error.message);
        } finally {
            if (submitPasswordBtn) this.resetButton(submitPasswordBtn, originalText);
        }
    }

    handleCancelPassword(event) {
        event.preventDefault();
        this.hidePasswordInputForm();
        
        // Clear any pending operations
        if (this.signUpService) {
            this.signUpService.clearPendingOperation();
        }
    }

    showSignUpSuccess(username) {
        // You can customize this to show a success message in the UI
        Utilities.logMessage(`Sign-up successful for ${username}`, "success");
    }

    showSignUpSuccessWithSignIn(username) {
        // Show success message for automatic sign-in after sign-up
        Utilities.logMessage(`Sign-up and automatic sign-in successful for ${username}`, "success");
    }

    showSignUpError(message) {
        // Log the error to console
        Utilities.logMessage(`Sign-up error: ${message}`, "error");
        
        // Display the error in the global error banner
        uiManager.showErrorBanner(message, 'signup');
    }

    showCodeVerificationError(message) {
        Utilities.logMessage(`Code verification error: ${message}`, "error");
        uiManager.showErrorBanner(message, 'signup');
    }

    showCodeResendSuccess() {
        Utilities.logMessage("Code resent successfully", "success");
        // Show a temporary success message
        const errorBanner = document.getElementById('errorBanner');
        const errorMessageElement = document.getElementById('errorMessage');
        
        if (errorBanner && errorMessageElement) {
            errorMessageElement.textContent = "Verification code has been resent to your email.";
            errorBanner.style.display = 'flex';
            errorBanner.style.backgroundColor = 'rgba(75, 181, 67, 0.2)';
            errorBanner.style.borderColor = '#4bb543';
            errorMessageElement.style.color = '#2c7b25';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                uiManager.hideErrorBanner();
                // Reset styles
                errorBanner.style.backgroundColor = '';
                errorBanner.style.borderColor = '';
                errorMessageElement.style.color = '';
            }, 5000);
        }
    }

    showCodeResendError(message) {
        Utilities.logMessage(`Code resend error: ${message}`, "error");
        uiManager.showErrorBanner(`Failed to resend code: ${message}`, 'signup');
    }

    showAttributesForm(result) {
        // Placeholder for additional attributes form if needed
        Utilities.logMessage("Additional attributes required for sign-up", "info");
        uiManager.showErrorBanner("Additional information is required to complete registration.", 'signup');
    }

    resetButton(button, originalText) {
        if (button) {
            button.disabled = false;
            button.textContent = originalText;
        }
    }
}
