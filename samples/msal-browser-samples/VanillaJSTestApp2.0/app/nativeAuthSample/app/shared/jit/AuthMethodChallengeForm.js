/*
 * Auth Method Challenge Form for JIT Registration
 * Reusable component for verifying authentication methods with OTP during JIT registration
 */

export class AuthMethodChallengeForm {
    constructor(cardId = "jitChallengeCard") {
        this.cardId = cardId;
        this.challenge = "";
        this.isLoading = false;
    }

    /**
     * Show the challenge verification form
     * @param {string} methodName - Name of the authentication method being verified
     */
    show(methodName = "your authentication method") {
        const card = document.getElementById(this.cardId);
        const instructions = document.getElementById(
            "jitChallengeInstructions"
        );

        if (card) {
            card.style.display = "block";
        }

        if (instructions) {
            instructions.textContent = `A verification code has been sent to ${methodName}. Please enter the code below:`;
        }

        this.clear();
        console.log(`Showing JIT challenge verification form`);
    }

    /**
     * Hide the challenge form
     */
    hide() {
        const card = document.getElementById(this.cardId);
        if (card) {
            card.style.display = "none";
        }
    }

    /**
     * Get the challenge code entered by user
     * @returns {string} Challenge code
     */
    getChallenge() {
        const codeInput = document.getElementById("jitChallengeCode");
        return codeInput ? codeInput.value.trim() : "";
    }

    /**
     * Set loading state for the form
     * @param {boolean} loading - Whether the form is in loading state
     */
    setLoading(loading) {
        this.isLoading = loading;

        const submitBtn = document.getElementById("submitJitChallengeBtn");
        const cancelBtn = document.getElementById("cancelJitChallengeBtn");
        const codeInput = document.getElementById("jitChallengeCode");

        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.textContent = loading ? "Verifying..." : "Verify Code";
        }

        if (cancelBtn) cancelBtn.disabled = loading;
        if (codeInput) codeInput.disabled = loading;
    }

    /**
     * Clear the form inputs
     */
    clear() {
        const codeInput = document.getElementById("jitChallengeCode");
        if (codeInput) {
            codeInput.value = "";
        }
        this.challenge = "";
        this.setLoading(false);
    }

    /**
     * Display an error message in the form
     * @param {string} message - Error message to display
     */
    showError(message) {
        console.error(`JIT Challenge Error: ${message}`);
        // Error will be displayed via the global error banner
    }
}
