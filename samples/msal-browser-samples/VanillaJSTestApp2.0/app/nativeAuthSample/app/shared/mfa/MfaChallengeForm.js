/*
 * MFA Challenge Form
 * Reusable component for MFA verification with OTP
 */

export class MfaChallengeForm {
    constructor(cardId = "mfaChallengeCard") {
        this.cardId = cardId;
        this.challenge = "";
        this.isLoading = false;
    }

    /**
     * Show the MFA challenge form
     * @param {string} methodName - Name of the MFA method being verified
     */
    show(methodName = "your selected method") {
        const card = document.getElementById(this.cardId);
        const instructions = document.getElementById(
            "mfaChallengeInstructions"
        );

        if (card) {
            card.style.display = "block";
        }

        if (instructions) {
            instructions.textContent = `A verification code has been sent to ${methodName}. Please enter the code below:`;
        }

        this.clear();
        console.log(`Showing MFA challenge form`);
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
        const codeInput = document.getElementById("mfaChallengeCode");
        return codeInput ? codeInput.value.trim() : "";
    }

    /**
     * Set loading state for the form
     * @param {boolean} loading - Whether the form is in loading state
     */
    setLoading(loading) {
        this.isLoading = loading;

        const submitBtn = document.getElementById("submitMfaChallengeBtn");
        const cancelBtn = document.getElementById("cancelMfaChallengeBtn");
        const codeInput = document.getElementById("mfaChallengeCode");

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
        const codeInput = document.getElementById("mfaChallengeCode");
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
        console.error(`MFA Challenge Error: ${message}`);
        // Error will be displayed via the global error banner
    }
}
