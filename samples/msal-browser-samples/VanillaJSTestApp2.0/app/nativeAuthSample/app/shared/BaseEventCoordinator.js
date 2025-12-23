/*
 * Base Event Coordinator for MSAL Native Auth Sample
 *
 * Provides common event coordination patterns shared across SignIn, SignUp, and ResetPassword flows:
 * 1. DOM ready initialization
 * 2. Event listener initialization guard
 * 3. Document-level event delegation for JIT and MFA forms
 * 4. Delegation methods to shared JIT/MFA handlers
 *
 * Subclasses must implement:
 * - Flow-specific form handlers (signin, signup, resetpassword)
 * - initializeFlowSpecificListeners() - Set up flow-specific event listeners
 */

import { JitAuthHandlers } from "./jit/JitAuthHandlers.js";
import { MfaAuthHandlers } from "./mfa/MfaAuthHandlers.js";

export class BaseEventCoordinator {
    /**
     * @param {Object} uiManager - UI manager for the flow
     * @param {Object} msalInstance - MSAL instance for SDK calls
     * @param {string} flowType - Flow identifier: "signin", "signup", or "resetpassword"
     */
    constructor(uiManager, msalInstance, flowType) {
        this.uiManager = uiManager;
        this.msalInstance = msalInstance;
        this.flowType = flowType;

        // Create shared handler instances for JIT and MFA flows
        // Pass the coordinator instance so handlers can access state
        this.jitHandlers = new JitAuthHandlers(uiManager, this, flowType);
        this.mfaHandlers = new MfaAuthHandlers(uiManager, this, flowType);

        this.eventListenersInitialized = false;

        // IMPORTANT: Don't initialize event listeners in constructor!
        // The subclass constructor needs to complete first to set up its own properties
        // (e.g., SignUpEventCoordinator needs to set up boundHandlers Map)
        // Instead, defer initialization to next tick
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => {
                this.initializeEventListeners();
            });
        } else {
            // DOM is already ready, but defer to allow subclass constructor to complete
            setTimeout(() => this.initializeEventListeners(), 0);
        }
    }

    /**
     * Initialize all event listeners
     * Subclasses should call super.initializeEventListeners() and then add flow-specific listeners
     */
    initializeEventListeners() {
        // Prevent double initialization
        if (this.eventListenersInitialized) {
            return;
        }

        console.log(`Initializing ${this.flowType} event listeners...`);

        // Let subclasses initialize their flow-specific listeners
        this.initializeFlowSpecificListeners();

        // Set up event delegation for dynamically-created JIT/MFA forms
        // These forms don't exist at initialization but are created by shared components
        this.setupDynamicFormDelegation();

        this.eventListenersInitialized = true;
        console.log(
            `${this.flowType} event listeners initialized successfully`
        );
    }

    /**
     * Initialize flow-specific event listeners
     * Subclasses MUST implement this method
     */
    initializeFlowSpecificListeners() {
        throw new Error(
            "Subclasses must implement initializeFlowSpecificListeners()"
        );
    }

    /**
     * Set up event delegation for dynamically-created JIT/MFA forms
     * This uses document-level event delegation to handle forms that are created on-demand
     */
    setupDynamicFormDelegation() {
        // Use event delegation on document for dynamically-created forms
        document.addEventListener("submit", (event) => {
            const formId = event.target.id;

            // Only handle if this coordinator's forms are initialized with data
            // JIT forms
            if (
                formId === "jitMethodSelectionForm" &&
                this.uiManager.jitMethodForm?.authMethods?.length > 0
            ) {
                this.handleJitMethodSubmit(event);
            } else if (
                formId === "jitChallengeForm" &&
                this.uiManager.jitChallengeForm &&
                this.getPendingState()
            ) {
                this.handleJitChallengeSubmit(event);
            }
            // MFA forms
            else if (
                formId === "mfaMethodSelectionForm" &&
                this.uiManager.mfaMethodForm?.authMethods?.length > 0 &&
                this.getPendingState()
            ) {
                this.handleMfaMethodSubmit(event);
            } else if (
                formId === "mfaChallengeForm" &&
                this.uiManager.mfaChallengeForm &&
                this.getPendingState()
            ) {
                this.handleMfaChallengeSubmit(event);
            }
        });

        // Handle button clicks for cancel
        document.addEventListener("click", (event) => {
            const buttonId = event.target.id;

            // JIT buttons
            if (buttonId === "cancelJitChallengeBtn") {
                this.handleCancelJit(event);
            }
            // MFA buttons
            else if (buttonId === "cancelMfaChallengeBtn") {
                this.handleCancelMfa(event);
            }
        });
    }

    // ========== JIT (Just-In-Time) Registration Delegation Methods ==========
    // These methods delegate to the shared JitAuthHandlers

    /**
     * Handle JIT method selection form submission
     * Delegates to shared JitAuthHandlers
     */
    handleJitMethodSubmit(event) {
        return this.jitHandlers.handleJitMethodSubmit(event);
    }

    /**
     * Handle JIT challenge form submission
     * Delegates to shared JitAuthHandlers
     */
    handleJitChallengeSubmit(event) {
        return this.jitHandlers.handleJitChallengeSubmit(event);
    }

    /**
     * Handle cancel JIT button click
     * Delegates to shared JitAuthHandlers
     */
    handleCancelJit(event) {
        return this.jitHandlers.handleCancelJit(event);
    }

    // ========== MFA (Multi-Factor Authentication) Delegation Methods ==========
    // These methods delegate to the shared MfaAuthHandlers

    /**
     * Handle MFA method selection form submission
     * Delegates to shared MfaAuthHandlers
     */
    handleMfaMethodSubmit(event) {
        return this.mfaHandlers.handleMfaMethodSubmit(event);
    }

    /**
     * Handle MFA challenge form submission
     * Delegates to shared MfaAuthHandlers
     */
    handleMfaChallengeSubmit(event) {
        return this.mfaHandlers.handleMfaChallengeSubmit(event);
    }

    /**
     * Handle cancel MFA button click
     * Delegates to shared MfaAuthHandlers
     */
    handleCancelMfa(event) {
        return this.mfaHandlers.handleCancelMfa(event);
    }
}
