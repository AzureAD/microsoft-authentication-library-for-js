/*
 * MSAL Native Auth Sample Application
 * Main application entry point for CustomAuthPublicClientApplication
 */

import { Utilities } from './utilities.js';
import { SignInModule } from './signin/index.js';
import { SignUpModule } from './signup/index.js';
import { ResetPasswordModule } from './resetPassword/index.js';
import { initMsalConfig } from './authConfig.js';

// Export singleton instance of NativeAuthApp
let nativeAuthAppInstance = null;

class NativeAuthApp {
    constructor() {
        this.msalInstance = null;
        this.currentAccount = null;
        this.CustomAuthPublicClientApplication = null;
        this.signInModule = null;
        this.signUpModule = null;
        this.resetPasswordModule = null;
    }

    async initializeMSAL() {
        Utilities.logMessage("Initializing MSAL Native Auth...", "info");

        if (typeof msalCustomAuth !== 'undefined' && msalCustomAuth.CustomAuthPublicClientApplication) {
            this.CustomAuthPublicClientApplication = msalCustomAuth.CustomAuthPublicClientApplication;
            Utilities.logMessage("Custom Auth API is loaded", "info");
        } else {
            Utilities.logMessage("No MSAL object found globally", "info");
            throw new Error("MSAL Custom Auth library not found. Please ensure the library is properly built and included.");
        }
        
        if (this.CustomAuthPublicClientApplication) {
            // Get the MSAL configuration
            const msalConfig = await initMsalConfig();
            Utilities.logMessage("Creating MSAL instance with config: " + JSON.stringify(msalConfig), "info");
            
            this.msalInstance = await this.CustomAuthPublicClientApplication.create(msalConfig);
            Utilities.logMessage("MSAL instance created successfully", "success");
            
            // Initialize sign-in module
            this.signInModule = new SignInModule(this.msalInstance);
            this.signInModule.initialize();
            
            // Initialize sign-up module
            this.signUpModule = new SignUpModule();
            await this.signUpModule.initialize(this.msalInstance);
            
            // Initialize reset password module
            this.resetPasswordModule = new ResetPasswordModule();
            await this.resetPasswordModule.initialize(this.msalInstance);
            
            // Initialize app-level navigation
            this.initializeNavigation();

            // Get current account if there is one
            this.getCurrentAccount();
            
            // Set initialization flag to true ONLY after MSAL and all modules are fully initialized
            this.setInitializedFlagTrue();
            Utilities.logMessage("MSAL fully initialized and ready for tests", "success");
            
            return this.msalInstance;
        } else {
            throw new Error("MSAL Custom Auth library not found. Please ensure the library is properly built and included.");
        }
    }

    // Set the initialized flag to true for test detection
    setInitializedFlagTrue() {
        const pcaInitElement = document.getElementById("pca-initialized");
        if (pcaInitElement) {
            pcaInitElement.textContent = "true";
            Utilities.logMessage("PCA initialization flag set to true for tests", "info");
        } else {
            Utilities.logMessage("Could not find pca-initialized element", "error");
            // Create element for test detection
            const initElement = document.createElement('div');
            initElement.id = 'pca-initialized';
            initElement.style.display = 'none';
            initElement.textContent = 'true';
            document.body.appendChild(initElement);
        }
    }

    // Core Authentication Methods

    // Get modules from instance
    getSignInModule() {
        return this.signInModule;
    }

    getSignUpModule() {
        return this.signUpModule;
    }

    getResetPasswordModule() {
        return this.resetPasswordModule;
    }

    getCurrentAccount() {
        try {
            Utilities.logMessage("Getting current account...", "info");
            
            if (!this.msalInstance) {
                throw new Error("MSAL not initialized. Cannot get current account.");
            }

            const result = this.msalInstance.getCurrentAccount();
            
            if (result.data) {
                const account = result.data.account;
                this.currentAccount = account;
                Utilities.logMessage("Current account retrieved successfully", "success");
                return { success: true, account: account };
            } else {
                Utilities.logMessage("No current account found", "info");
                return { success: false, account: null };
            }

        } catch (error) {
            Utilities.logMessage(`Failed to get current account`, "error");
            Utilities.logMessage("Get account error: " + error.message, "error");
            throw error;
        }
    }

    async signOut() {
        try {
            Utilities.logMessage("Signing out...", "info");
            
            if (!this.msalInstance) {
                throw new Error("MSAL not initialized. Cannot perform sign-out.");
            }

            const account = this.msalInstance.getCurrentAccount();

            if (account.data) {
                await account.data.signOut();
                Utilities.logMessage("User successfully signed out", "success");
            } else {
                Utilities.logMessage("No account data available to sign out", "info");
            }

            // Clear current account
            this.currentAccount = null;
            // cleanupMsalResources(true);
            
            Utilities.logMessage("Signed out successfully", "success");
            return true;
            
        } catch (error) {
            Utilities.logMessage(`Sign-out failed`, "error");
            Utilities.logMessage("Sign-out error: " + error.message, "error");
            throw error;
        }
    }

    /**
     * Initialize app-level navigation between sign-in and sign-up forms
     */
    initializeNavigation() {
        const showSignInBtn = document.getElementById('showSignInBtn');
        const showSignUpBtn = document.getElementById('showSignUpBtn');
        const showResetPasswordBtn = document.getElementById('showResetPasswordBtn');

        // Handle navigation to sign-in form
        if (showSignInBtn) {
            showSignInBtn.addEventListener('click', () => {
                this.showSignInForm();
            });
        }

        // Handle navigation to sign-up form  
        if (showSignUpBtn) {
            showSignUpBtn.addEventListener('click', () => {
                this.showSignUpForm();
            });
        }

        // Handle navigation to reset password form
        if (showResetPasswordBtn) {
            showResetPasswordBtn.addEventListener('click', () => {
                this.showResetPasswordForm();
            });
        }

        Utilities.logMessage('App-level navigation initialized', 'info');
    }

    /**
     * Show sign-in form and hide other forms
     */
    showSignInForm() {
        const showSignInBtn = document.getElementById('showSignInBtn');
        const showSignUpBtn = document.getElementById('showSignUpBtn');
        const signInCard = document.getElementById('signInCard');
        const signUpCard = document.getElementById('signUpCard');
        const resetPasswordCard = document.getElementById('resetPasswordCard');
        const resetPasswordCodeCard = document.getElementById('resetPasswordCodeCard');
        const resetPasswordNewPasswordCard = document.getElementById('resetPasswordNewPasswordCard');
        const codeVerificationCard = document.getElementById('codeVerificationCard');
        const passwordInputCard = document.getElementById('passwordInputCard');

        // Update button states
        if (showSignInBtn) showSignInBtn.classList.add('active');
        if (showSignUpBtn) showSignUpBtn.classList.remove('active');

        // Show sign-in form, hide other forms
        if (signInCard) signInCard.style.display = 'block';
        if (signUpCard) signUpCard.style.display = 'none';
        if (resetPasswordCard) resetPasswordCard.style.display = 'none';
        if (resetPasswordCodeCard) resetPasswordCodeCard.style.display = 'none';
        if (resetPasswordNewPasswordCard) resetPasswordNewPasswordCard.style.display = 'none';
        if (codeVerificationCard) codeVerificationCard.style.display = 'none';
        if (passwordInputCard) passwordInputCard.style.display = 'none';

        Utilities.logMessage('Switched to sign-in form', 'info');
    }

    /**
     * Show sign-up form and hide other forms
     */
    showSignUpForm() {
        const showSignInBtn = document.getElementById('showSignInBtn');
        const showSignUpBtn = document.getElementById('showSignUpBtn');
        const signInCard = document.getElementById('signInCard');
        const signUpCard = document.getElementById('signUpCard');
        const resetPasswordCard = document.getElementById('resetPasswordCard');
        const resetPasswordCodeCard = document.getElementById('resetPasswordCodeCard');
        const resetPasswordNewPasswordCard = document.getElementById('resetPasswordNewPasswordCard');
        const codeVerificationCard = document.getElementById('codeVerificationCard');
        const passwordInputCard = document.getElementById('passwordInputCard');

        // Update button states
        if (showSignInBtn) showSignInBtn.classList.remove('active');
        if (showSignUpBtn) showSignUpBtn.classList.add('active');

        // Show sign-up form, hide other forms
        if (signInCard) signInCard.style.display = 'none';
        if (signUpCard) signUpCard.style.display = 'block';
        if (resetPasswordCard) resetPasswordCard.style.display = 'none';
        if (resetPasswordCodeCard) resetPasswordCodeCard.style.display = 'none';
        if (resetPasswordNewPasswordCard) resetPasswordNewPasswordCard.style.display = 'none';
        if (codeVerificationCard) codeVerificationCard.style.display = 'none';
        if (passwordInputCard) passwordInputCard.style.display = 'none';

        Utilities.logMessage('Switched to sign-up form', 'info');
    }

    /**
     * Show reset password form and hide other forms
     */
    showResetPasswordForm() {
        const showSignInBtn = document.getElementById('showSignInBtn');
        const showSignUpBtn = document.getElementById('showSignUpBtn');
        const showResetPasswordBtn = document.getElementById('showResetPasswordBtn');
        const signInCard = document.getElementById('signInCard');
        const signUpCard = document.getElementById('signUpCard');
        const resetPasswordCard = document.getElementById('resetPasswordCard');
        const resetPasswordCodeCard = document.getElementById('resetPasswordCodeCard');
        const resetPasswordNewPasswordCard = document.getElementById('resetPasswordNewPasswordCard');
        const codeVerificationCard = document.getElementById('codeVerificationCard');
        const passwordInputCard = document.getElementById('passwordInputCard');

        // Update button states
        if (showSignInBtn) showSignInBtn.classList.remove('active');
        if (showSignUpBtn) showSignUpBtn.classList.remove('active');
        if (showResetPasswordBtn) showResetPasswordBtn.classList.add('active');

        // Show reset password form, hide other forms
        if (signInCard) signInCard.style.display = 'none';
        if (signUpCard) signUpCard.style.display = 'none';
        if (resetPasswordCard) resetPasswordCard.style.display = 'block';
        if (resetPasswordCodeCard) resetPasswordCodeCard.style.display = 'none';
        if (resetPasswordNewPasswordCard) resetPasswordNewPasswordCard.style.display = 'none';
        if (codeVerificationCard) codeVerificationCard.style.display = 'none';
        if (passwordInputCard) passwordInputCard.style.display = 'none';

        Utilities.logMessage('Switched to reset password form', 'info');
    }
}

/**
 * Get the singleton instance of NativeAuthApp
 * @returns {NativeAuthApp} The singleton instance
 */
export function getNativeAuthApp() {
    return nativeAuthAppInstance;
}

// Helper functions to access modules from the nativeAuthAppInstance
export function getSignInModule() {
    return nativeAuthAppInstance?.signInModule || null;
}

export function getSignUpModule() {
    return nativeAuthAppInstance?.signUpModule || null;
}

export function getResetPasswordModule() {
    return nativeAuthAppInstance?.resetPasswordModule || null;
}

// Initialize the app when DOM is loaded and make it globally available
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Create new instance
        const app = new NativeAuthApp();
        nativeAuthAppInstance = app;

        // Initialize MSAL
        await app.initializeMSAL();

    } catch (error) {
        Utilities.logMessage("Failed to initialize MSAL: " + error.message, "error");
        // Don't set initialization flag to true if initialization fails
    }
});

// Export a clean API for importing modules
export default {
    getNativeAuthApp,
    getSignInModule,
    getSignUpModule,
    getResetPasswordModule,
};
