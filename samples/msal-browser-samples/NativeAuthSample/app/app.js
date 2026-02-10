/*
 * MSAL Native Auth Sample Application
 * Main application entry point for CustomAuthPublicClientApplication
 */

import { SignInModule } from "./flows/signin/index.js";
import { SignUpModule } from "./flows/signup/index.js";
import { ResetPasswordModule } from "./flows/resetPassword/index.js";
import { initMsalConfig } from "./authConfig.js";
import uiManager from "./ui/ui.js";

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
        console.log("Initializing MSAL Native Auth...");

        if (
            typeof msalCustomAuth !== "undefined" &&
            msalCustomAuth.CustomAuthPublicClientApplication
        ) {
            this.CustomAuthPublicClientApplication =
                msalCustomAuth.CustomAuthPublicClientApplication;
            console.log("Custom Auth API is loaded");
        } else {
            console.log("No MSAL object found globally");
            throw new Error(
                "MSAL Custom Auth library not found. Please ensure the library is properly built and included."
            );
        }

        if (this.CustomAuthPublicClientApplication) {
            // Get the MSAL configuration
            const msalConfig = await initMsalConfig();
            console.log(
                `Creating MSAL instance with config: ${JSON.stringify(
                    msalConfig
                )}`
            );

            this.msalInstance =
                await this.CustomAuthPublicClientApplication.create(msalConfig);
            console.log("MSAL instance created successfully");

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
            console.log("MSAL fully initialized and ready for tests");

            return this.msalInstance;
        } else {
            throw new Error(
                "MSAL Custom Auth library not found. Please ensure the library is properly built and included."
            );
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
            // Create element for test detection
            const initElement = document.createElement("div");
            initElement.id = "pca-initialized";
            initElement.style.display = "none";
            initElement.textContent = "true";
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
            console.log("Getting current account...");

            if (!this.msalInstance) {
                throw new Error(
                    "MSAL not initialized. Cannot get current account."
                );
            }

            const result = this.msalInstance.getCurrentAccount();

            if (result.data) {
                const account = result.data.account;
                this.currentAccount = account;
                console.log("Current account retrieved successfully");

                // Update UI manager with account info to show signed-in status
                console.log(
                    "🔍 APP: Updating UI with current account on page load"
                );
                uiManager.updateAccountInfo(account);

                return { success: true, account: account };
            } else {
                console.log("No current account found");

                // Update UI manager to show no user signed in
                uiManager.updateAccountInfo(null);

                return { success: false, account: null };
            }
        } catch (error) {
            console.error(`Failed to get current account`);
            console.error(`Get account error: ${error.message}`);
            throw error;
        }
    }

    async signOut() {
        try {
            console.log("Signing out...");

            if (!this.msalInstance) {
                throw new Error(
                    "MSAL not initialized. Cannot perform sign-out."
                );
            }

            const account = this.msalInstance.getCurrentAccount();

            if (account.data) {
                await account.data.signOut();
                console.log("User successfully signed out");
            } else {
                console.log("No account data available to sign out");
            }

            // Clear current account
            this.currentAccount = null;
            // cleanupMsalResources(true);

            console.log("Signed out successfully");
            return true;
        } catch (error) {
            console.error(`Sign-out failed`);
            console.error(`Sign-out error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Initialize app-level navigation between sign-in and sign-up forms
     */
    initializeNavigation() {
        const showSignInBtn = document.getElementById("showSignInBtn");
        const showSignUpBtn = document.getElementById("showSignUpBtn");
        const showResetPasswordBtn = document.getElementById(
            "showResetPasswordBtn"
        );

        // Handle navigation to sign-in form
        if (showSignInBtn) {
            showSignInBtn.addEventListener("click", () => {
                this.showSignInForm();
            });
        }

        // Handle navigation to sign-up form
        if (showSignUpBtn) {
            showSignUpBtn.addEventListener("click", () => {
                this.showSignUpForm();
            });
        }

        // Handle navigation to reset password form
        if (showResetPasswordBtn) {
            showResetPasswordBtn.addEventListener("click", () => {
                this.showResetPasswordForm();
            });
        }

        console.log("App-level navigation initialized");
    }

    /**
     * Show sign-in form and hide other forms
     */
    showSignInForm() {
        const showSignInBtn = document.getElementById("showSignInBtn");
        const showSignUpBtn = document.getElementById("showSignUpBtn");
        const showResetPasswordBtn = document.getElementById(
            "showResetPasswordBtn"
        );
        const signInCard = document.getElementById("signInCard");
        const signUpCard = document.getElementById("signUpCard");
        const resetPasswordCard = document.getElementById("resetPasswordCard");
        const resetPasswordNewPasswordCard = document.getElementById(
            "resetPasswordNewPasswordCard"
        );
        const codeVerificationCard = document.getElementById(
            "codeVerificationCard"
        );
        const passwordInputCard = document.getElementById("passwordInputCard");
        const jitMethodSelectionCard = document.getElementById(
            "jitMethodSelectionCard"
        );
        const jitChallengeCard = document.getElementById("jitChallengeCard");
        const mfaMethodSelectionCard = document.getElementById(
            "mfaMethodSelectionCard"
        );
        const mfaChallengeCard = document.getElementById("mfaChallengeCard");

        // Update button states
        if (showSignInBtn) showSignInBtn.classList.add("active");
        if (showSignUpBtn) showSignUpBtn.classList.remove("active");
        if (showResetPasswordBtn)
            showResetPasswordBtn.classList.remove("active");

        // Show sign-in form, hide other forms
        if (signInCard) signInCard.style.display = "block";
        if (signUpCard) signUpCard.style.display = "none";
        if (resetPasswordCard) resetPasswordCard.style.display = "none";
        if (resetPasswordNewPasswordCard)
            resetPasswordNewPasswordCard.style.display = "none";
        if (codeVerificationCard) codeVerificationCard.style.display = "none";
        if (passwordInputCard) passwordInputCard.style.display = "none";
        if (jitMethodSelectionCard)
            jitMethodSelectionCard.style.display = "none";
        if (jitChallengeCard) jitChallengeCard.style.display = "none";
        if (mfaMethodSelectionCard)
            mfaMethodSelectionCard.style.display = "none";
        if (mfaChallengeCard) mfaChallengeCard.style.display = "none";

        console.log("Switched to sign-in form");
    }

    /**
     * Show sign-up form and hide other forms
     */
    showSignUpForm() {
        const showSignInBtn = document.getElementById("showSignInBtn");
        const showSignUpBtn = document.getElementById("showSignUpBtn");
        const showResetPasswordBtn = document.getElementById(
            "showResetPasswordBtn"
        );
        const signInCard = document.getElementById("signInCard");
        const signUpCard = document.getElementById("signUpCard");
        const resetPasswordCard = document.getElementById("resetPasswordCard");
        const resetPasswordNewPasswordCard = document.getElementById(
            "resetPasswordNewPasswordCard"
        );
        const codeVerificationCard = document.getElementById(
            "codeVerificationCard"
        );
        const passwordInputCard = document.getElementById("passwordInputCard");
        const jitMethodSelectionCard = document.getElementById(
            "jitMethodSelectionCard"
        );
        const jitChallengeCard = document.getElementById("jitChallengeCard");
        const mfaMethodSelectionCard = document.getElementById(
            "mfaMethodSelectionCard"
        );
        const mfaChallengeCard = document.getElementById("mfaChallengeCard");

        // Update button states
        if (showSignInBtn) showSignInBtn.classList.remove("active");
        if (showSignUpBtn) showSignUpBtn.classList.add("active");
        if (showResetPasswordBtn)
            showResetPasswordBtn.classList.remove("active");

        // Show sign-up form, hide other forms
        if (signInCard) signInCard.style.display = "none";
        if (signUpCard) signUpCard.style.display = "block";
        if (resetPasswordCard) resetPasswordCard.style.display = "none";
        if (resetPasswordNewPasswordCard)
            resetPasswordNewPasswordCard.style.display = "none";
        if (codeVerificationCard) codeVerificationCard.style.display = "none";
        if (passwordInputCard) passwordInputCard.style.display = "none";
        if (jitMethodSelectionCard)
            jitMethodSelectionCard.style.display = "none";
        if (jitChallengeCard) jitChallengeCard.style.display = "none";
        if (mfaMethodSelectionCard)
            mfaMethodSelectionCard.style.display = "none";
        if (mfaChallengeCard) mfaChallengeCard.style.display = "none";

        console.log("Switched to sign-up form");
    }

    /**
     * Show reset password form and hide other forms
     */
    showResetPasswordForm() {
        const showSignInBtn = document.getElementById("showSignInBtn");
        const showSignUpBtn = document.getElementById("showSignUpBtn");
        const showResetPasswordBtn = document.getElementById(
            "showResetPasswordBtn"
        );
        const signInCard = document.getElementById("signInCard");
        const signUpCard = document.getElementById("signUpCard");
        const resetPasswordCard = document.getElementById("resetPasswordCard");
        const resetPasswordNewPasswordCard = document.getElementById(
            "resetPasswordNewPasswordCard"
        );
        const codeVerificationCard = document.getElementById(
            "codeVerificationCard"
        );
        const passwordInputCard = document.getElementById("passwordInputCard");
        const jitMethodSelectionCard = document.getElementById(
            "jitMethodSelectionCard"
        );
        const jitChallengeCard = document.getElementById("jitChallengeCard");
        const mfaMethodSelectionCard = document.getElementById(
            "mfaMethodSelectionCard"
        );
        const mfaChallengeCard = document.getElementById("mfaChallengeCard");

        // Update button states
        if (showSignInBtn) showSignInBtn.classList.remove("active");
        if (showSignUpBtn) showSignUpBtn.classList.remove("active");
        if (showResetPasswordBtn) showResetPasswordBtn.classList.add("active");

        // Show reset password form, hide other forms
        if (signInCard) signInCard.style.display = "none";
        if (signUpCard) signUpCard.style.display = "none";
        if (resetPasswordCard) resetPasswordCard.style.display = "block";
        if (resetPasswordNewPasswordCard)
            resetPasswordNewPasswordCard.style.display = "none";
        if (codeVerificationCard) codeVerificationCard.style.display = "none";
        if (passwordInputCard) passwordInputCard.style.display = "none";
        if (jitMethodSelectionCard)
            jitMethodSelectionCard.style.display = "none";
        if (jitChallengeCard) jitChallengeCard.style.display = "none";
        if (mfaMethodSelectionCard)
            mfaMethodSelectionCard.style.display = "none";
        if (mfaChallengeCard) mfaChallengeCard.style.display = "none";

        console.log("Switched to reset password form");
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
document.addEventListener("DOMContentLoaded", async () => {
    try {
        // Create new instance
        const app = new NativeAuthApp();
        nativeAuthAppInstance = app;

        // Initialize MSAL
        await app.initializeMSAL();
    } catch (error) {
        console.error(`Failed to initialize MSAL: ${error.message}`);
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
