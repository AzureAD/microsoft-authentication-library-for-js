/*
 * Sign-In Module Entry Point for MSAL Native Auth Sample
 * 
 * This module serves as the main entry point for the sign-in functionality,
 * coordinating between the SignInService and SignInUIManager to provide
 * a complete sign-in experience.
 */

import { SignInService } from './SignInService.js';
import { SignInUIManager } from './SignInUIManager.js';

export class SignInModule {
    constructor(msalInstance) {
        this.msalInstance = msalInstance;
        this.signInService = new SignInService(msalInstance);
        this.signInUIManager = new SignInUIManager(this.signInService);
    }

    /**
     * Initialize the sign-in module
     */
    initialize() {
        // The SignInUIManager already initializes event listeners in its constructor
        console.log('Sign-in module initialized');
    }

    /**
     * Get the sign-in service instance
     * @returns {SignInService} The sign-in service
     */
    getService() {
        return this.signInService;
    }

    /**
     * Get the sign-in UI manager instance
     * @returns {SignInUIManager} The sign-in UI manager
     */
    getUIManager() {
        return this.signInUIManager;
    }

    /**
     * Check if there's a pending sign-in operation
     * @returns {boolean} True if there's a pending operation
     */
    hasPendingOperation() {
        return this.signInService.hasPendingOperation();
    }

    /**
     * Clear any pending sign-in operation
     */
    clearPendingOperation() {
        this.signInService.clearPendingOperation();
    }
}
