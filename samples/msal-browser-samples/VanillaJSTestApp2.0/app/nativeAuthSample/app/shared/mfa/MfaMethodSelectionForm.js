/*
 * MFA Method Selection Form
 * Reusable component for selecting MFA authentication methods
 */

export class MfaMethodSelectionForm {
    constructor(cardId = "mfaMethodSelectionCard") {
        this.cardId = cardId;
        this.authMethods = [];
        this.selectedMethod = null;
        this.isLoading = false;
    }

    /**
     * Initialize the form with MFA methods
     * @param {Array} authMethods - Available MFA methods from SDK
     */
    initialize(authMethods) {
        this.authMethods = authMethods || [];
        this.selectedMethod =
            this.authMethods.length > 0 ? this.authMethods[0] : null;
        this.render();
    }

    /**
     * Render the MFA method selection form
     */
    render() {
        const methodSelect = document.getElementById("mfaAuthMethodSelect");
        if (methodSelect && this.authMethods.length > 0) {
            // Clear existing options
            methodSelect.innerHTML = "";

            // Populate dropdown with available methods
            this.authMethods.forEach((method, index) => {
                const option = document.createElement("option");
                option.value = index;
                option.textContent = this.getMethodDisplayName(
                    method.challenge_channel
                );
                methodSelect.appendChild(option);
            });

            // Set selected method
            if (this.selectedMethod) {
                const selectedIndex = this.authMethods.indexOf(
                    this.selectedMethod
                );
                methodSelect.value = selectedIndex;
            }
        }
    }

    /**
     * Get display-friendly name for MFA method
     * @param {string} challengeChannel - Challenge channel type (email/sms/phone)
     * @returns {string} Display name
     */
    getMethodDisplayName(challengeChannel) {
        const channelMap = {
            email: "Email",
            sms: "SMS",
            phone: "Phone",
        };
        return channelMap[challengeChannel] || challengeChannel;
    }

    /**
     * Show the form card
     */
    show() {
        const card = document.getElementById(this.cardId);
        if (card) {
            card.style.display = "block";
            console.log(`Showing MFA method selection form`);
        }
    }

    /**
     * Hide the form card
     */
    hide() {
        const card = document.getElementById(this.cardId);
        if (card) {
            card.style.display = "none";
        }
    }

    /**
     * Get the currently selected MFA method
     * @returns {Object} Selected method object
     */
    getSelectedMethod() {
        const methodSelect = document.getElementById("mfaAuthMethodSelect");
        if (methodSelect && methodSelect.value !== "") {
            const selectedIndex = parseInt(methodSelect.value);
            if (!isNaN(selectedIndex) && this.authMethods[selectedIndex]) {
                return this.authMethods[selectedIndex];
            }
        }
        // Fallback to stored selected method or first method if available
        return (
            this.selectedMethod ||
            (this.authMethods.length > 0 ? this.authMethods[0] : null)
        );
    }

    /**
     * Set loading state for the form
     * @param {boolean} loading - Whether the form is in loading state
     */
    setLoading(loading) {
        this.isLoading = loading;

        const submitBtn = document.getElementById("submitMfaMethodBtn");
        const cancelBtn = document.getElementById("cancelMfaMethodBtn");
        const methodSelect = document.getElementById("mfaAuthMethodSelect");

        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.textContent = loading ? "Processing..." : "Continue";
        }

        if (cancelBtn) cancelBtn.disabled = loading;
        if (methodSelect) methodSelect.disabled = loading;
    }

    /**
     * Clear the form
     */
    clear() {
        this.setLoading(false);
    }

    /**
     * Setup event listener for method selection change
     * @param {Function} callback - Callback to execute when method changes
     */
    onMethodChange(callback) {
        const methodSelect = document.getElementById("mfaAuthMethodSelect");
        if (methodSelect) {
            methodSelect.addEventListener("change", () => {
                if (callback) callback(this.getSelectedMethod());
            });
        }
    }
}
