/*
 * Sign-In Module Entry Point for MSAL Native Auth Sample
 */

import { SignInUIManager } from "./SignInUIManager.js";

export class SignInModule {
    constructor(msalInstance) {
        this.msalInstance = msalInstance;
        this.signInUIManager = new SignInUIManager(msalInstance);
    }

    /**
     * Initialize the sign-in module
     */
    initialize() {
        // The SignInUIManager already initializes event listeners in its constructor
        console.log("Sign-in module initialized");
    }

    // Get UI manager access
    getUIManager() {
        return this.signInUIManager;
    }

    hasPendingOperation() {
        return (
            this.signInUIManager.eventHandlers &&
            this.signInUIManager.eventHandlers.hasPendingOperation()
        );
    }

    /**
     * Clear any pending sign-in operation
     */
    clearPendingOperation() {
        if (this.signInUIManager.eventHandlers) {
            this.signInUIManager.eventHandlers.clearPendingOperation();
        }
    }
}
