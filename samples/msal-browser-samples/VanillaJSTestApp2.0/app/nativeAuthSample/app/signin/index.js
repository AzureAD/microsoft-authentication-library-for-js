/*
 * Sign-In Module Entry Point for MSAL Native Auth Sample
 */

import { SignInService } from './SignInService.js';
import { SignInUIManager } from './SignInUIManager.js';
import { Utilities } from '../utilities.js';

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
        Utilities.logMessage('Sign-in module initialized', 'info');
    }

    // Get service and UI manager access
    getService() {
        return this.signInService;
    }

    getUIManager() {
        return this.signInUIManager;
    }

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
