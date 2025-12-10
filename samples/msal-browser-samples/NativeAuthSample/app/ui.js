/*
 * UI Management for MSAL Native Auth Sample
 */

// Import the NativeAuthApp module and utilities
import { getNativeAuthApp } from './app.js';
import { Utilities } from './utilities.js';

class UIManager {
    constructor() {
        // Track if we have a current account
        this.hasCurrentAccount = false;
        
        // Initialize the auth status banner
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.updateAuthStatusBanner();
            });
        } else {
            this.updateAuthStatusBanner();
        }
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Wait for the app to be initialized
        document.addEventListener('DOMContentLoaded', () => {
            // Check if user is already signed in
            this.handleGetCurrentAccount();
            
            // For the navigation bar sign out button
            const navSignOutBtn = document.getElementById('navSignOutBtn');
            if (navSignOutBtn) {
                navSignOutBtn.addEventListener('click', this.handleSignOut.bind(this));
            }

            // For dismissing error messages
            const dismissErrorBtn = document.getElementById('dismissErrorBtn');
            if (dismissErrorBtn) {
                dismissErrorBtn.addEventListener('click', this.hideErrorBanner.bind(this));
            }
        });
    }

    // handleViewAccountDetails method removed as it was related to account information

    async handleGetCurrentAccount() {
        try {
            // Get the native auth app instance using the imported function
            const nativeAuthApp = getNativeAuthApp();
            
            if (!nativeAuthApp) {
                throw new Error("Authentication app not initialized");
            }

            const result = await nativeAuthApp.getCurrentAccount();
            
            if (result.success && result.account) {
                this.updateAccountInfo(result.account);
            } else {
                this.updateAccountInfo(null);
            }
        } catch (error) {
            Utilities.logMessage(`Get current account error: ${error}`, "error");
            this.updateAccountInfo(null);
        }
    }

    async handleSignOut() {
        try {
            // Get the native auth app instance using the imported function
            const nativeAuthApp = getNativeAuthApp();
            
            if (!nativeAuthApp) {
                throw new Error("Authentication app not initialized");
            }

            // First check if there's a current account by calling getCurrentAccount
            const accountResult = await nativeAuthApp.getCurrentAccount();
            
            // Only sign out if there's a current account
            if (accountResult.success && accountResult.account) {
                await nativeAuthApp.signOut();
                
                // Update account status
                this.updateAccountInfo(null);
                
                // Hide the auth success card
                const authSuccessCard = document.getElementById('authSuccessCard');
                if (authSuccessCard) {
                    authSuccessCard.style.display = 'none';
                }
                
                // Clear forms
                const signInForm = document.getElementById('signInForm');
                if (signInForm) {
                    signInForm.reset();
                }
                
                const signUpForm = document.getElementById('signUpForm');
                if (signUpForm) {
                    signUpForm.reset();
                }

                const resetPasswordForm = document.getElementById('resetPasswordForm');
                if (resetPasswordForm) {
                    resetPasswordForm.reset();
                }

                // Update navigation button status
                const showSignInBtn = document.getElementById('showSignInBtn');
                const showSignUpBtn = document.getElementById('showSignUpBtn');
                const showResetPasswordBtn = document.getElementById('showResetPasswordBtn');
                
                if (showSignInBtn) showSignInBtn.classList.add('active');
                if (showSignUpBtn) showSignUpBtn.classList.remove('active');
                if (showResetPasswordBtn) showResetPasswordBtn.classList.remove('active');
            }            
        } catch (error) {
            Utilities.logMessage(`Sign-out error: ${error}`, "error");
        }
    }

    // UI Helper Methods (button loading methods moved to SignInUIManager)

    updateAccountInfo(account) {
        // Update hasCurrentAccount flag
        this.hasCurrentAccount = !!account;
        
        // Update the auth status banner
        this.updateAuthStatusBanner();
    }
    
    updateAuthStatusBanner() {
        const authStatusBanner = document.getElementById('authStatusBanner');
        if (authStatusBanner) {
            if (this.hasCurrentAccount) {
                authStatusBanner.textContent = 'Signed in!';
                authStatusBanner.className = 'auth-status-banner auth-status-signed-in';
            } else {
                authStatusBanner.textContent = 'No user signed in';
                authStatusBanner.className = 'auth-status-banner auth-status-signed-out';
            }
        }
    }

    /**
     * Shows an error banner with the provided message
     * @param {string} errorMessage - The error message to display
     * @param {string} flow - The flow during which the error occurred ('signin', 'signup', or 'resetpassword')
     */
    showErrorBanner(errorMessage, flow = 'general') {
        Utilities.logMessage(`Error in ${flow} flow: ${errorMessage}`, "error");
        
        const errorBanner = document.getElementById('errorBanner');
        const errorMessageElement = document.getElementById('errorMessage');
        
        if (errorBanner && errorMessageElement) {
            // Format the message with flow context
            let formattedMessage = errorMessage;
            switch (flow) {
                case 'signin':
                    formattedMessage = `Sign-in Error: ${errorMessage}`;
                    break;
                case 'signup':
                    formattedMessage = `Sign-up Error: ${errorMessage}`;
                    break;
                case 'resetpassword':
                    formattedMessage = `Password Reset Error: ${errorMessage}`;
                    break;
                default:
                    formattedMessage = `Error: ${errorMessage}`;
            }
            
            errorMessageElement.textContent = formattedMessage;
            errorBanner.style.display = 'flex';
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                this.hideErrorBanner();
            }, 10000);
        }
    }

    /**
     * Hides the error banner
     */
    hideErrorBanner() {
        const errorBanner = document.getElementById('errorBanner');
        if (errorBanner) {
            errorBanner.style.display = 'none';
        }
    }
}

// Create and export a singleton instance of UIManager
const uiManager = new UIManager();

// Export the instance for module imports
export default uiManager;
