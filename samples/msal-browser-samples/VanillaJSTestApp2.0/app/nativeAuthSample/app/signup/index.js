/*
 * Sign-Up Module for MSAL Native Auth Sample
 * 
 * This module coordinates the sign-up service and UI manager, providing a unified
 * interface for sign-up functionality. It follows the same pattern as the SignInModule
 * and integrates cleanly with the main application.
 */

import { SignUpService } from './SignUpService.js';
import { SignUpUIManager } from './SignUpUIManager.js';

export class SignUpModule {
    constructor() {
        this.signUpService = null;
        this.signUpUIManager = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the sign-up module with MSAL instance
     * @param {Object} msalInstance - The MSAL instance for authentication
     */
    async initialize(msalInstance) {
        try {
            if (this.isInitialized) {
                console.warn('SignUpModule already initialized');
                return;
            }

            if (!msalInstance) {
                throw new Error('MSAL instance is required for sign-up module initialization');
            }

            console.log('Initializing SignUpModule...');

            // Initialize the sign-up service
            this.signUpService = new SignUpService(msalInstance);
            console.log('SignUpService initialized');

            // Initialize the UI manager
            this.signUpUIManager = new SignUpUIManager(this.signUpService);
            console.log('SignUpUIManager initialized');

            this.isInitialized = true;
            console.log('SignUpModule initialization completed successfully');

        } catch (error) {
            console.error('Failed to initialize SignUpModule:', error);
            throw error;
        }
    }

    /**
     * Update the MSAL instance (useful for configuration changes)
     * @param {Object} msalInstance - The new MSAL instance
     */
    updateMsalInstance(msalInstance) {
        if (this.signUpService) {
            this.signUpService.setMsalInstance(msalInstance);
            console.log('MSAL instance updated in SignUpService');
        }
    }

    /**
     * Get the sign-up service instance
     * @returns {SignUpService|null} The sign-up service instance
     */
    getSignUpService() {
        return this.signUpService;
    }

    /**
     * Get the sign-up service instance (alias for compatibility)
     * @returns {SignUpService|null} The sign-up service instance
     */
    getService() {
        return this.signUpService;
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
        if (this.signUpService) {
            this.signUpService.clearPendingOperation();
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
        if (!this.signUpService) {
            return false;
        }
        return this.signUpService.hasPendingOperation();
    }

    /**
     * Get current sign-up state information
     * @returns {Object} Current state information
     */
    getCurrentState() {
        if (!this.signUpService) {
            return { initialized: false };
        }

        return {
            initialized: this.isInitialized,
            pendingOperation: this.signUpService.hasPendingOperation(),
            currentUsername: this.signUpService.getCurrentUsername()
        };
    }

    /**
     * Programmatically show the sign-up form
     */
    showSignUpForm() {
        if (this.signUpUIManager) {
            this.signUpUIManager.showSignUpForm();
        } else {
            console.warn('SignUpUIManager not initialized');
        }
    }

    /**
     * Programmatically hide the sign-up form and show sign-in
     */
    showSignInForm() {
        if (this.signUpUIManager) {
            this.signUpUIManager.showSignInForm();
        } else {
            console.warn('SignUpUIManager not initialized');
        }
    }

    /**
     * Clean up resources and event listeners
     */
    cleanup() {
        if (this.signUpService) {
            this.signUpService.clearPendingOperation();
        }

        if (this.signUpUIManager && this.signUpUIManager.cleanup) {
            this.signUpUIManager.cleanup();
        }

        this.isInitialized = false;
        console.log('SignUpModule cleaned up');
    }

    /**
     * Get module status for debugging
     * @returns {Object} Module status information
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            hasSignUpService: !!this.signUpService,
            hasSignUpUIManager: !!this.signUpUIManager,
            currentState: this.getCurrentState()
        };
    }
}
