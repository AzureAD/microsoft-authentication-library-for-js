/*
 * Reset Password Module for MSAL Native Auth Sample
 */

import { ResetPasswordService } from './ResetPasswordService.js';
import { ResetPasswordUIManager } from './ResetPasswordUIManager.js';
import { Utilities } from '../utilities.js';

export class ResetPasswordModule {
    constructor() {
        this.resetPasswordService = null;
        this.resetPasswordUIManager = null;
        this.isInitialized = false;
    }

    // Initialize the reset password module with MSAL instance
    async initialize(msalInstance) {
        try {
            if (this.isInitialized) {
                Utilities.logMessage('ResetPasswordModule already initialized', 'warning');
                return;
            }

            if (!msalInstance) {
                throw new Error('MSAL instance is required for reset password module initialization');
            }

            Utilities.logMessage('Initializing ResetPasswordModule...', 'info');

            // Initialize the reset password service
            this.resetPasswordService = new ResetPasswordService(msalInstance);
            Utilities.logMessage('ResetPasswordService initialized', 'info');

            // Initialize the UI manager
            this.resetPasswordUIManager = new ResetPasswordUIManager(this.resetPasswordService);
            Utilities.logMessage('ResetPasswordUIManager initialized', 'info');

            this.isInitialized = true;
            Utilities.logMessage('ResetPasswordModule initialization completed successfully', 'success');

        } catch (error) {
            Utilities.logMessage('Failed to initialize ResetPasswordModule: ' + error.message, 'error');
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
            Utilities.logMessage('MSAL instance updated in ResetPasswordService', 'info');
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
            Utilities.logMessage('ResetPasswordUIManager not initialized', 'warning');
        }
    }

    /**
     * Programmatically hide the reset password form and show sign-in
     */
    showSignInForm() {
        if (this.resetPasswordUIManager) {
            this.resetPasswordUIManager.showSignInForm();
        } else {
            Utilities.logMessage('ResetPasswordUIManager not initialized', 'warning');
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
        Utilities.logMessage('ResetPasswordModule cleaned up', 'info');
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
