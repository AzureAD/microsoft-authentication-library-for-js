/*
 * MSAL Native Auth Sample Application
 * 
 * This sample demonstrates how to use the CustomAuthPublicClientApplication
 * from @azure/msal-browser/custom_auth for Native Authentication flows.
 * 
 * Prerequisites:
 * 1. The msal-browser library with custom auth support must be built
 * 2. Update authConfig.js with your actual Azure configuration
 * 3. Ensure your application is registered for Native Authentication
 */

import { Utilities } from './utilities.js';
import { SignInModule } from './signin/index.js';
import { SignUpModule } from './signup/index.js';
import { ResetPasswordModule } from './resetPassword/index.js';

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
        
        // // Create the pca-initialized element for test detection
        // // But set its content to 'false' until initialization is complete
        // this.createPCAInitializedElement();
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
            Utilities.logMessage("Creating MSAL instance..." + JSON.stringify(msalConfig), "info");
            
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
            console.log("PCA initialization flag set to true for tests");
        } else {
            console.error("Could not find pca-initialized element");
            // Create it if it doesn't exist
            this.createPCAInitializedElement();
            document.getElementById("pca-initialized").textContent = "true";
        }
    }

    // Core Authentication Methods

    /**
     * Get the sign-in module for accessing sign-in functionality
     * @returns {SignInModule} The sign-in module instance
     */
    getSignInModule() {
        return this.signInModule;
    }

    /**
     * Get the sign-up module for accessing sign-up functionality
     * @returns {SignUpModule} The sign-up module instance
     */
    getSignUpModule() {
        return this.signUpModule;
    }

    /**
     * Get the reset password module for accessing reset password functionality
     * @returns {ResetPasswordModule} The reset password module instance
     */
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
            console.error("Get account error:", error);
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
            console.error("Sign-out error:", error);
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

        console.log('App-level navigation initialized');
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

        console.log('Switched to sign-in form');
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

        console.log('Switched to sign-up form');
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

        console.log('Switched to reset password form');
    }
}

/**
 * Get the singleton instance of NativeAuthApp
 * @returns {NativeAuthApp} The singleton instance
 */
export function getNativeAuthApp() {
    return nativeAuthAppInstance;
}

/**
 * Get the SignInModule instance
 * @returns {SignInModule} The SignInModule instance
 */
export function getSignInModule() {
    return nativeAuthAppInstance?.signInModule || null;
}

/**
 * Get the SignUpModule instance
 * @returns {SignUpModule} The SignUpModule instance
 */
export function getSignUpModule() {
    return nativeAuthAppInstance?.signUpModule || null;
}

/**
 * Get the ResetPasswordModule instance
 * @returns {ResetPasswordModule} The ResetPasswordModule instance
 */
export function getResetPasswordModule() {
    return nativeAuthAppInstance?.resetPasswordModule || null;
}

/**
 * Clean up MSAL and module resources to prevent memory leaks
 * Call this function when the application is shutting down or needs to reset state
 * @param {boolean} temporaryInstancesOnly - If true, only clean up temporary instances
 * @returns {boolean} Success status of the cleanup operation
 */
export function cleanupMsalResources(temporaryInstancesOnly = false) {
    try {
        console.log("Cleaning up MSAL resources...");
        
        if (!nativeAuthAppInstance && !temporaryInstancesOnly) {
            console.log("No MSAL resources to clean up - app not initialized");
            return true;
        }
        
        // If we're only cleaning up temporary instances, skip the main app instance cleanup
        if (!temporaryInstancesOnly) {
            // 1. Clean up SignIn module resources
            if (nativeAuthAppInstance.signInModule) {
                // Add any specific cleanup for sign-in module
                console.log("Cleaning up SignIn module resources");
                nativeAuthAppInstance.signInModule.getUIManager().setSignInService(null);
            }
            
            // 2. Clean up SignUp module resources
            if (nativeAuthAppInstance.signUpModule) {
                // Add any specific cleanup for sign-up module
                console.log("Cleaning up SignUp module resources");
                if (nativeAuthAppInstance.signUpModule.signUpUIManager) {
                    nativeAuthAppInstance.signUpModule.signUpUIManager.setSignUpService(null);
                }
            }
            
            // 3. Clean up ResetPassword module resources
            if (nativeAuthAppInstance.resetPasswordModule) {
                // Add any specific cleanup for reset password module
                console.log("Cleaning up ResetPassword module resources");
                if (nativeAuthAppInstance.resetPasswordModule.resetPasswordUIManager) {
                    nativeAuthAppInstance.resetPasswordModule.resetPasswordUIManager.setResetPasswordService(null);
                }
            }
            
            // 4. Clear the MSAL instance reference
            if (nativeAuthAppInstance.msalInstance) {
                console.log("Clearing MSAL instance reference");
                nativeAuthAppInstance.msalInstance = null;
            }
            
            // 5. Clear module references
            nativeAuthAppInstance.signInModule = null;
            nativeAuthAppInstance.signUpModule = null;
            nativeAuthAppInstance.resetPasswordModule = null;
            nativeAuthAppInstance.currentAccount = null;
            
            // 6. Clear the app instance reference
            nativeAuthAppInstance = null;
        }
        
        // Force garbage collection hint (not guaranteed)
        if (typeof global !== 'undefined' && global.gc) {
            global.gc();
        }
        
        console.log("MSAL resources cleaned up successfully");
        return true;
    } catch (error) {
        console.error("Error cleaning up MSAL resources:", error);
        return false;
    }
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
        console.error("Failed to initialize MSAL:", error);
        // Don't set initialization flag to true if initialization fails
    }
});

// Export a clean API for importing modules
export default {
    getNativeAuthApp,
    getSignInModule,
    getSignUpModule,
    getResetPasswordModule,
    cleanupMsalResources,
};
