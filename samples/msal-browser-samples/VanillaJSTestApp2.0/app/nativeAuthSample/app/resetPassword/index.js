/*
 * Reset Password Module for MSAL Native Auth Sample
 * 
 * This module coordinates the reset password service and UI manager, providing a unified
 * interface for password reset functionality. It follows the same pattern as the SignUpModule
 * and integrates cleanly with the main application.
 */

import { ResetPasswordService } from './ResetPasswordService.js';
import { ResetPasswordUIManager } from './ResetPasswordUIManager.js';

export class ResetPasswordModule {
    constructor() {
        this.resetPasswordService = null;
        this.resetPasswordUIManager = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the reset password module with MSAL instance
     * @param {Object} msalInstance - The MSAL instance for authentication
     */
    async initialize(msalInstance) {
        try {
            if (this.isInitialized) {
                console.warn('ResetPasswordModule already initialized');
                return;
            }

            if (!msalInstance) {
                throw new Error('MSAL instance is required for reset password module initialization');
            }

            console.log('Initializing ResetPasswordModule...');

            // Initialize the reset password service
            this.resetPasswordService = new ResetPasswordService(msalInstance);
            console.log('ResetPasswordService initialized');

            // Initialize the UI manager
            this.resetPasswordUIManager = new ResetPasswordUIManager(this.resetPasswordService);
            console.log('ResetPasswordUIManager initialized');

            this.isInitialized = true;
            console.log('ResetPasswordModule initialization completed successfully');

        } catch (error) {
            console.error('Failed to initialize ResetPasswordModule:', error);
            throw error;
        }
    }

    /**
     * Update the MSAL instance (useful for configuration changes)
     * @param {Object} msalInstance - The new MSAL instance
     */
    updateMsalInstance(msalInstance) {
        if (this.resetPasswordService) {
            this.resetPasswordService.setMsalInstance(msalInstance);
            console.log('MSAL instance updated in ResetPasswordService');
        }
    }

    /**
     * Get the reset password service instance
     * @returns {ResetPasswordService|null} The reset password service instance
     */
    getResetPasswordService() {
        return this.resetPasswordService;
    }

    /**
     * Get the reset password service instance (alias for compatibility)
     * @returns {ResetPasswordService|null} The reset password service instance
     */
    getService() {
        return this.resetPasswordService;
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
        if (this.resetPasswordService) {
            this.resetPasswordService.clearPendingOperation();
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
        if (!this.resetPasswordService) {
            return false;
        }
        return this.resetPasswordService.hasPendingOperation();
    }

    /**
     * Get current reset password state information
     * @returns {Object} Current state information
     */
    getCurrentState() {
        if (!this.resetPasswordService) {
            return { initialized: false };
        }

        return {
            initialized: this.isInitialized,
            pendingOperation: this.resetPasswordService.hasPendingOperation(),
            currentEmail: this.resetPasswordService.getCurrentEmail()
        };
    }

    /**
     * Programmatically show the reset password form
     */
    showResetPasswordForm() {
        if (this.resetPasswordUIManager) {
            this.resetPasswordUIManager.showResetPasswordForm();
        } else {
            console.warn('ResetPasswordUIManager not initialized');
        }
    }

    /**
     * Programmatically hide the reset password form and show sign-in
     */
    showSignInForm() {
        if (this.resetPasswordUIManager) {
            this.resetPasswordUIManager.showSignInForm();
        } else {
            console.warn('ResetPasswordUIManager not initialized');
        }
    }

    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        if (this.resetPasswordService) {
            this.resetPasswordService.clearPendingOperation();
        }

        if (this.resetPasswordUIManager && this.resetPasswordUIManager.cleanup) {
            this.resetPasswordUIManager.cleanup();
        }

        this.isInitialized = false;
        console.log('ResetPasswordModule cleaned up');
    }

    /**
     * Get module status for debugging
     * @returns {Object} Module status information
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            hasResetPasswordService: !!this.resetPasswordService,
            hasResetPasswordUIManager: !!this.resetPasswordUIManager,
            currentState: this.getCurrentState()
        };
    }
}
