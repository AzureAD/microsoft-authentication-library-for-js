/*
 * Reset Password Module for MSAL Native Auth Sample
 */

import { ResetPasswordUIManager } from "./ResetPasswordUIManager.js";

export class ResetPasswordModule {
    constructor() {
        this.msalInstance = null;
        this.resetPasswordUIManager = null;
        this.isInitialized = false;
    }

    // Initialize the reset password module with MSAL instance
    async initialize(msalInstance) {
        try {
            if (this.isInitialized) {
                console.warn("ResetPasswordModule already initialized");
                return;
            }

            if (!msalInstance) {
                throw new Error(
                    "MSAL instance is required for reset password module initialization"
                );
            }

            console.log("Initializing ResetPasswordModule...");

            // Store MSAL instance
            this.msalInstance = msalInstance;
            console.log("MSAL instance stored");

            // Initialize the UI manager with msalInstance
            this.resetPasswordUIManager = new ResetPasswordUIManager(
                msalInstance
            );
            console.log("ResetPasswordUIManager initialized");

            this.isInitialized = true;
            console.log(
                "ResetPasswordModule initialization completed successfully"
            );
        } catch (error) {
            console.error(
                `Failed to initialize ResetPasswordModule: ${error.message}`
            );
            throw error;
        }
    }

    /**
     * Get the reset password UI manager instance
     * @returns {ResetPasswordUIManager|null} The reset password UI manager instance
     */
    getResetPasswordUIManager() {
        return this.resetPasswordUIManager;
    }

    /**
     * Get the reset password UI manager instance (alias for compatibility)
     * @returns {ResetPasswordUIManager|null} The reset password UI manager instance
     */
    getUIManager() {
        return this.resetPasswordUIManager;
    }

    /**
     * Check if the module is initialized
     * @returns {boolean} True if initialized, false otherwise
     */
    getIsInitialized() {
        return this.isInitialized;
    }

    /**
     * Clear any pending reset password operations
     */
    clearPendingOperations() {
        if (
            this.resetPasswordUIManager &&
            this.resetPasswordUIManager.eventCoordinator
        ) {
            this.resetPasswordUIManager.eventCoordinator.clearPendingOperation();
        }
    }

    /**
     * Clear any pending reset password operation (alias for compatibility)
     */
    clearPendingOperation() {
        this.clearPendingOperations();
    }

    /**
     * Check if there's a pending reset password operation
     * @returns {boolean} True if there's a pending operation
     */
    hasPendingOperation() {
        if (
            !this.resetPasswordUIManager ||
            !this.resetPasswordUIManager.eventCoordinator
        ) {
            return false;
        }
        return this.resetPasswordUIManager.eventCoordinator.hasPendingOperation();
    }

    /**
     * Get current reset password state information
     * @returns {Object} Current state information
     */
    getCurrentState() {
        if (
            !this.resetPasswordUIManager ||
            !this.resetPasswordUIManager.eventCoordinator
        ) {
            return { initialized: false };
        }

        return {
            initialized: this.isInitialized,
            pendingOperation:
                this.resetPasswordUIManager.eventCoordinator.hasPendingOperation(),
            currentEmail:
                this.resetPasswordUIManager.eventCoordinator.getCurrentEmail(),
        };
    }

    /**
     * Programmatically show the reset password form
     */
    showResetPasswordForm() {
        if (this.resetPasswordUIManager) {
            this.resetPasswordUIManager.showResetPasswordForm();
        } else {
            console.warn("ResetPasswordUIManager not initialized");
        }
    }

    /**
     * Programmatically hide the reset password form and show sign-in
     */
    showSignInForm() {
        if (this.resetPasswordUIManager) {
            this.resetPasswordUIManager.showSignInForm();
        } else {
            console.warn("ResetPasswordUIManager not initialized");
        }
    }

    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        if (
            this.resetPasswordUIManager &&
            this.resetPasswordUIManager.eventCoordinator
        ) {
            this.resetPasswordUIManager.eventCoordinator.clearPendingOperation();
        }

        if (
            this.resetPasswordUIManager &&
            this.resetPasswordUIManager.cleanup
        ) {
            this.resetPasswordUIManager.cleanup();
        }

        this.isInitialized = false;
        console.log("ResetPasswordModule cleaned up");
    }

    /**
     * Get module status for debugging
     * @returns {Object} Module status information
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            hasResetPasswordUIManager: !!this.resetPasswordUIManager,
            currentState: this.getCurrentState(),
        };
    }
}
