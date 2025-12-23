/*
 * Sign-Up Module for MSAL Native Auth Sample
 */

import { SignUpUIManager } from "./SignUpUIManager.js";

export class SignUpModule {
    constructor() {
        this.msalInstance = null;
        this.signUpUIManager = null;
        this.isInitialized = false;
    }

    // Initialize the sign-up module with MSAL instance
    async initialize(msalInstance) {
        try {
            if (this.isInitialized) {
                console.warn("SignUpModule already initialized");
                return;
            }

            if (!msalInstance) {
                throw new Error(
                    "MSAL instance is required for sign-up module initialization"
                );
            }

            console.log("Initializing SignUpModule...");

            // Store MSAL instance
            this.msalInstance = msalInstance;
            console.log("MSAL instance stored");

            // Initialize the UI manager with msalInstance
            this.signUpUIManager = new SignUpUIManager(msalInstance);
            console.log("SignUpUIManager initialized");

            this.isInitialized = true;
            console.log("SignUpModule initialization completed successfully");
        } catch (error) {
            console.error(`Failed to initialize SignUpModule: ${error}`);
            throw error;
        }
    }

    /**
     * Get the sign-up UI manager instance
     * @returns {SignUpUIManager|null} The sign-up UI manager instance
     */
    getSignUpUIManager() {
        return this.signUpUIManager;
    }

    /**
     * Get the sign-up UI manager instance (alias for compatibility)
     * @returns {SignUpUIManager|null} The sign-up UI manager instance
     */
    getUIManager() {
        return this.signUpUIManager;
    }

    /**
     * Check if the module is initialized
     * @returns {boolean} True if initialized, false otherwise
     */
    getIsInitialized() {
        return this.isInitialized;
    }

    /**
     * Clear any pending sign-up operations
     */
    clearPendingOperations() {
        if (this.signUpUIManager && this.signUpUIManager.eventCoordinator) {
            this.signUpUIManager.eventCoordinator.clearPendingOperation();
        }
    }

    /**
     * Clear any pending sign-up operation (alias for compatibility)
     */
    clearPendingOperation() {
        this.clearPendingOperations();
    }

    /**
     * Check if there's a pending sign-up operation
     * @returns {boolean} True if there's a pending operation
     */
    hasPendingOperation() {
        if (!this.signUpUIManager || !this.signUpUIManager.eventCoordinator) {
            return false;
        }
        return this.signUpUIManager.eventCoordinator.hasPendingOperation();
    }

    /**
     * Get current sign-up state information
     * @returns {Object} Current state information
     */
    getCurrentState() {
        if (!this.signUpUIManager || !this.signUpUIManager.eventCoordinator) {
            return { initialized: false };
        }

        return {
            initialized: this.isInitialized,
            pendingOperation:
                this.signUpUIManager.eventCoordinator.hasPendingOperation(),
            currentUsername:
                this.signUpUIManager.eventCoordinator.getCurrentUsername(),
        };
    }

    /**
     * Programmatically show the sign-up form
     */
    showSignUpForm() {
        if (this.signUpUIManager) {
            this.signUpUIManager.showSignUpForm();
        } else {
            console.warn("SignUpUIManager not initialized");
        }
    }

    /**
     * Programmatically hide the sign-up form and show sign-in
     */
    showSignInForm() {
        if (this.signUpUIManager) {
            this.signUpUIManager.showSignInForm();
        } else {
            console.warn("SignUpUIManager not initialized");
        }
    }

    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        if (this.signUpUIManager && this.signUpUIManager.eventCoordinator) {
            this.signUpUIManager.eventCoordinator.clearPendingOperation();
        }

        if (this.signUpUIManager && this.signUpUIManager.cleanup) {
            this.signUpUIManager.cleanup();
        }

        this.isInitialized = false;
        console.log("SignUpModule cleaned up");
    }

    /**
     * Get module status for debugging
     * @returns {Object} Module status information
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            hasSignUpUIManager: !!this.signUpUIManager,
            currentState: this.getCurrentState(),
        };
    }
}
