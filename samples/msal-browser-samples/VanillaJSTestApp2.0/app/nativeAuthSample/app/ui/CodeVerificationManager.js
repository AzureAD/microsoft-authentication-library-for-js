/*
 * Code Verification Manager for MSAL Native Auth Sample
 *
 * Manages event handlers for the shared code verification form across different flows.
 * Replaces the problematic cloneNode() pattern with proper event listener tracking.
 *
 * The code verification form (codeVerificationCard) is shared between:
 * - Sign-in flow (OTP verification)
 * - Sign-up flow (email verification)
 * - Reset password flow (email verification)
 *
 * This manager ensures only one flow's handlers are active at a time.
 */

class CodeVerificationManager {
    constructor() {
        this.currentContext = null;
        this.handlers = {
            submit: null,
            resend: null,
            cancel: null,
        };
    }

    /**
     * Set up handlers for a specific context (flow)
     * @param {string} context - Flow context: "signin", "signup", or "resetpassword"
     * @param {Function} submitHandler - Handler for form submission
     * @param {Function} resendHandler - Handler for resend button (optional, can be null)
     * @param {Function} cancelHandler - Handler for cancel button
     */
    setupForContext(context, submitHandler, resendHandler, cancelHandler) {
        console.log(
            `CodeVerificationManager: Setting up handlers for ${context}`
        );

        // Remove any existing handlers first
        this.removeHandlers();

        // Get form elements
        const codeVerificationForm = document.getElementById(
            "codeVerificationForm"
        );
        const resendCodeBtn = document.getElementById("resendCodeBtn");
        const cancelCodeBtn = document.getElementById("cancelCodeBtn");

        // Store new handlers
        this.handlers.submit = submitHandler;
        this.handlers.resend = resendHandler;
        this.handlers.cancel = cancelHandler;
        this.currentContext = context;

        // Add new handlers
        if (codeVerificationForm && submitHandler) {
            codeVerificationForm.addEventListener("submit", submitHandler);
            console.log(
                `CodeVerificationManager: Submit handler attached for ${context}`
            );
        }

        if (resendCodeBtn && resendHandler) {
            resendCodeBtn.addEventListener("click", resendHandler);
            console.log(
                `CodeVerificationManager: Resend handler attached for ${context}`
            );
        }

        if (cancelCodeBtn && cancelHandler) {
            cancelCodeBtn.addEventListener("click", cancelHandler);
            console.log(
                `CodeVerificationManager: Cancel handler attached for ${context}`
            );
        }
    }

    /**
     * Remove all current handlers
     */
    removeHandlers() {
        if (!this.handlers.submit && !this.handlers.cancel) {
            return; // No handlers to remove
        }

        console.log(
            `CodeVerificationManager: Removing handlers for ${this.currentContext}`
        );

        // Get form elements
        const codeVerificationForm = document.getElementById(
            "codeVerificationForm"
        );
        const resendCodeBtn = document.getElementById("resendCodeBtn");
        const cancelCodeBtn = document.getElementById("cancelCodeBtn");

        // Remove handlers using stored references
        if (codeVerificationForm && this.handlers.submit) {
            codeVerificationForm.removeEventListener(
                "submit",
                this.handlers.submit
            );
        }

        if (resendCodeBtn && this.handlers.resend) {
            resendCodeBtn.removeEventListener("click", this.handlers.resend);
        }

        if (cancelCodeBtn && this.handlers.cancel) {
            cancelCodeBtn.removeEventListener("click", this.handlers.cancel);
        }

        // Clear stored handlers
        this.handlers.submit = null;
        this.handlers.resend = null;
        this.handlers.cancel = null;
        this.currentContext = null;
    }

    /**
     * Get the current context (for debugging)
     * @returns {string|null} Current context or null
     */
    getCurrentContext() {
        return this.currentContext;
    }
}

// Export singleton instance
export const codeVerificationManager = new CodeVerificationManager();
