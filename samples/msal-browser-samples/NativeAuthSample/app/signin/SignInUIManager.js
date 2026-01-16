/*
 * Sign-In UI Manager for MSAL Native Auth Sample
 */

import uiManager from '../ui.js';
import { Utilities } from '../utilities.js';

export class SignInUIManager {
    constructor(signInService) {
        this.signInService = signInService;
        this.eventListenersInitialized = false;
        
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
     * Update the sign-in service reference
     */
    setSignInService(signInService) {
        this.signInService = signInService;
    }

    /**
     * Initialize all sign-in related event listeners
     */
    initializeEventListeners() {
        // Prevent double initialization
        if (this.eventListenersInitialized) {
            return;
        }

        Utilities.logMessage('Initializing SignInUIManager event listeners...', 'info');
        
        // Form submissions
        const signInForm = document.getElementById('signInForm');
        if (signInForm) {
            signInForm.addEventListener('submit', this.handleSignInSubmit.bind(this));
            Utilities.logMessage('Sign-in form event listener attached', 'info');
        } else {
            Utilities.logMessage('Sign-in form not found in DOM', 'warning');
        }

        // Code verification form handlers are now set up dynamically in setupCodeVerificationHandlers
        // This prevents conflicts with SignUpUIManager handlers

        // Password input form
        const passwordInputForm = document.getElementById('passwordInputForm');
        if (passwordInputForm) {
            passwordInputForm.addEventListener('submit', this.handlePasswordSubmit.bind(this));
        }

        const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
        if (cancelPasswordBtn) {
            cancelPasswordBtn.addEventListener('click', this.handleCancelPassword.bind(this));
        }

        // Navigation buttons
        const showSignInBtn = document.getElementById('showSignInBtn');
        if (showSignInBtn) {
            showSignInBtn.addEventListener('click', this.showSignInForm.bind(this));
        }

        this.eventListenersInitialized = true;
        Utilities.logMessage('SignInUIManager event listeners initialized successfully', 'success');
    }

    // Navigation Methods
    showSignInForm() {
        const showSignInBtn = document.getElementById('showSignInBtn');
        const showSignUpBtn = document.getElementById('showSignUpBtn');
        const signInCard = document.getElementById('signInCard');
        const signUpCard = document.getElementById('signUpCard');
        const codeVerificationCard = document.getElementById('codeVerificationCard');
        const passwordInputCard = document.getElementById('passwordInputCard');

        // Update button states
        if (showSignInBtn) showSignInBtn.classList.add('active');
        if (showSignUpBtn) showSignUpBtn.classList.remove('active');

        // Show sign-in form, hide other forms
        if (signInCard) signInCard.style.display = 'block';
        if (signUpCard) signUpCard.style.display = 'none';
        if (codeVerificationCard) codeVerificationCard.style.display = 'none';
        if (passwordInputCard) passwordInputCard.style.display = 'none';

        // Clear any previous form data
        this.clearSignInForm();
    }

    showCodeVerificationForm(username) {
        const signInCard = document.getElementById('signInCard');
        const signUpCard = document.getElementById('signUpCard');
        const codeVerificationCard = document.getElementById('codeVerificationCard');
        const passwordInputCard = document.getElementById('passwordInputCard');
        const codeInstructions = document.getElementById('codeInstructions');

        // Hide other forms
        if (signInCard) signInCard.style.display = 'none';
        if (signUpCard) signUpCard.style.display = 'none';
        if (passwordInputCard) passwordInputCard.style.display = 'none';

        // Update instructions with username
        if (codeInstructions) {
            codeInstructions.textContent = `A verification code has been sent to ${username}. Please check your email and enter the code below:`;
        }

        // Show code verification form
        if (codeVerificationCard) codeVerificationCard.style.display = 'block';

        // Set up context-specific event handlers
        this.setupCodeVerificationHandlers('signin');

        // Focus on the code input field
        const verificationCodeInput = document.getElementById('verificationCode');
        if (verificationCodeInput) {
            setTimeout(() => verificationCodeInput.focus(), 100);
        }
    }

    showPasswordInputForm(username) {
        const signInCard = document.getElementById('signInCard');
        const signUpCard = document.getElementById('signUpCard');
        const codeVerificationCard = document.getElementById('codeVerificationCard');
        const passwordInputCard = document.getElementById('passwordInputCard');
        const passwordInstructions = document.getElementById('passwordInstructions');

        // Hide other forms
        if (signInCard) signInCard.style.display = 'none';
        if (signUpCard) signUpCard.style.display = 'none';
        if (codeVerificationCard) codeVerificationCard.style.display = 'none';

        // Update instructions with username
        if (passwordInstructions) {
            passwordInstructions.textContent = `Please enter your password for ${username} to complete sign-in:`;
        }

        // Show password input form
        if (passwordInputCard) passwordInputCard.style.display = 'block';

        // Focus on the password input field
        const passwordInput = document.getElementById('signInPassword');
        if (passwordInput) {
            setTimeout(() => passwordInput.focus(), 100);
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
        
        // Show sign-in form again
        this.showSignInForm();
    }

    hidePasswordInputForm() {
        const passwordInputCard = document.getElementById('passwordInputCard');
        if (passwordInputCard) passwordInputCard.style.display = 'none';
        
        // Clear the password input
        const passwordInput = document.getElementById('signInPassword');
        if (passwordInput) {
            passwordInput.value = '';
        }
        
        // Show sign-in form again
        this.showSignInForm();
    }

    clearSignInForm() {
        const signInForm = document.getElementById('signInForm');
        if (signInForm) {
            signInForm.reset();
        }
    }

    /**
     * Set up context-specific handlers for code verification
     */
    setupCodeVerificationHandlers(context = 'signin') {
        // Remove any existing handlers first (in case they were set by another manager)
        const codeVerificationForm = document.getElementById('codeVerificationForm');
        const resendCodeBtn = document.getElementById('resendCodeBtn');
        const cancelCodeBtn = document.getElementById('cancelCodeBtn');

        if (codeVerificationForm) {
            // Remove existing listeners by cloning the element (removes all listeners)
            const newForm = codeVerificationForm.cloneNode(true);
            codeVerificationForm.parentNode.replaceChild(newForm, codeVerificationForm);
        }

        if (resendCodeBtn) {
            const newResendBtn = resendCodeBtn.cloneNode(true);
            resendCodeBtn.parentNode.replaceChild(newResendBtn, resendCodeBtn);
        }

        if (cancelCodeBtn) {
            const newCancelBtn = cancelCodeBtn.cloneNode(true);
            cancelCodeBtn.parentNode.replaceChild(newCancelBtn, cancelCodeBtn);
        }

        // Add context-specific handlers
        if (context === 'signin') {
            const newCodeForm = document.getElementById('codeVerificationForm');
            const newResendBtn = document.getElementById('resendCodeBtn');
            const newCancelBtn = document.getElementById('cancelCodeBtn');

            if (newCodeForm) {
                newCodeForm.addEventListener('submit', this.handleCodeSubmit.bind(this));
            }

            if (newResendBtn) {
                newResendBtn.addEventListener('click', this.handleResendCode.bind(this));
            }

            if (newCancelBtn) {
                newCancelBtn.addEventListener('click', this.handleCancelCode.bind(this));
            }
        }
    }

    // Form Handlers
    async handleSignInSubmit(event) {
        event.preventDefault();
        
        const signInBtn = document.getElementById('signInBtn');
        const originalText = signInBtn ? signInBtn.textContent : 'Sign In';
        
        try {
            // Show loading state
            if (signInBtn) this.setButtonLoading(signInBtn, 'Signing in...');
            
            // Get form data
            const formData = new FormData(event.target);
            const username = formData.get('username');

            if (!username) {
                throw new Error("Username is required");
            }

            if (!this.signInService) {
                throw new Error("Sign-in service not available");
            }

            // Call the authentication method (passwordless flow)
            const result = await this.signInService.signIn(username);
            
            Utilities.logMessage("🔍 SIGNIN UI MANAGER: handleSignInSubmit result received", "info");
            if (result.success) {
                // Notify main UI manager about successful sign-in
                uiManager.updateAccountInfo(result.account);

                // Clear the form on success
                event.target.reset();
            } else if (result.state === 'code_required') {
                // Show code verification form
                this.showCodeVerificationForm(username);
            } else if (result.state === 'password_required') {
                // Show password input form
                this.showPasswordInputForm(username);
            } else {
                // Handle other failure cases
                Utilities.logMessage(`Sign-in failed`, "error");
                throw new Error(result.error || "An error occurred during sign-in");
            }

        } catch (error) {
            Utilities.logMessage(error.message, "error");
            // Show error in the UI
            uiManager.showErrorBanner(error.message, 'signin');
        } finally {
            if (signInBtn) this.resetButton(signInBtn, originalText);
        }
    }

    async handleCodeSubmit(event) {
        event.preventDefault();
        
        Utilities.logMessage("🔍 SIGNIN UI MANAGER: handleCodeSubmit called", "info");
        
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

            if (!this.signInService) {
                throw new Error("Sign-in service not available");
            }

            // Call the code submission method
            const result = await this.signInService.submitCode(code);
            
            if (result.success) {
                // Notify main UI manager about successful verification
                uiManager.updateAccountInfo(result.account);
                this.hideCodeVerificationForm();
                
                // Clear the form on success
                event.target.reset();
            } else if (result.state === 'failed') {
                throw new Error(result.error || "Code verification failed");
            }

        } catch (error) {
            Utilities.logMessage(`Code verification error: ${error}`, "error");
            // Show error in the UI
            uiManager.showErrorBanner(error.message || "An error occurred during code verification", 'signin');
        } finally {
            if (submitCodeBtn) this.resetButton(submitCodeBtn, originalText);
        }
    }

    async handleResendCode() {
        const resendCodeBtn = document.getElementById('resendCodeBtn');
        const originalText = resendCodeBtn ? resendCodeBtn.textContent : 'Resend Code';
        
        try {
            // Show loading state
            if (resendCodeBtn) this.setButtonLoading(resendCodeBtn, 'Resending...');
            
            if (!this.signInService) {
                throw new Error("Sign-in service not available");
            }

            // Call the resend code method
            const result = await this.signInService.resendCode();
            
            if (result.success) {
                Utilities.logMessage("Verification code resent successfully", "success");
            } else {
                throw new Error("Failed to resend verification code");
            }

        } catch (error) {
            Utilities.logMessage(`Resend code error: ${error}`, "error");
            // Show error in the UI
            uiManager.showErrorBanner(error.message || "Failed to resend verification code", 'signin');
        } finally {
            if (resendCodeBtn) this.resetButton(resendCodeBtn, originalText);
        }
    }

    handleCancelCode() {
        // Hide the code verification form and return to sign-in
        this.hideCodeVerificationForm();
        Utilities.logMessage("Code verification cancelled", "info");
        
        // Clear any pending operations
        if (this.signInService) {
            this.signInService.clearPendingOperation();
        }
    }

    async handlePasswordSubmit(event) {
        event.preventDefault();
        
        const submitPasswordBtn = document.getElementById('submitPasswordBtn');
        const originalText = submitPasswordBtn ? submitPasswordBtn.textContent : 'Verify Password';
        
        try {
            // Show loading state
            if (submitPasswordBtn) this.setButtonLoading(submitPasswordBtn, 'Verifying...');
            
            // Get form data
            const formData = new FormData(event.target);
            const password = formData.get('password');

            if (!password) {
                throw new Error("Password is required");
            }

            if (!this.signInService) {
                throw new Error("Sign-in service not available");
            }

            // Call the password submission method
            const result = await this.signInService.submitPassword(password);
            
            if (result.success) {
                // Notify main UI manager about successful verification
                uiManager.updateAccountInfo(result.account);
                this.hidePasswordInputForm();

                // Clear the form on success
                event.target.reset();
            } else if (result.state === 'failed') {
                throw new Error("Password verification failed");
            }
        } catch (error) {
            Utilities.logMessage(`Password verification error: ${error}`, "error");
            // Show error in the UI
            uiManager.showErrorBanner(error.message || "Invalid password or authentication error", 'signin');
        } finally {
            if (submitPasswordBtn) this.resetButton(submitPasswordBtn, originalText);
        }
    }

    handleCancelPassword() {
        // Hide the password input form and return to sign-in
        this.hidePasswordInputForm();
        Utilities.logMessage("Password input cancelled", "info");
        
        // Clear any pending operations
        if (this.signInService) {
            this.signInService.clearPendingOperation();
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
}
