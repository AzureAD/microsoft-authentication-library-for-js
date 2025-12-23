/*
 * Auth Method Selection Form for JIT Registration
 * Reusable component for selecting and configuring authentication methods during JIT registration
 */

export class AuthMethodSelectionForm {
    constructor(cardId = "jitMethodSelectionCard") {
        this.cardId = cardId;
        this.authMethods = [];
        this.selectedMethod = null;
        this.verificationContact = "";
        this.isLoading = false;
    }

    /**
     * Initialize the form with authentication methods
     * @param {Array} authMethods - Available authentication methods from SDK
     */
    initialize(authMethods) {
        this.authMethods = authMethods || [];
        this.selectedMethod =
            this.authMethods.length > 0 ? this.authMethods[0] : null;
        this.render();
    }

    /**
     * Render the authentication method selection form
     */
    render() {
        const methodSelect = document.getElementById("jitAuthMethodSelect");
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

            // Update contact input placeholder based on selected method
            this.updateContactInputPlaceholder();

            // Set up event listener for method selection changes
            this.setupMethodChangeListener();
        }
    }

    /**
     * Setup event listener for method selection changes
     */
    setupMethodChangeListener() {
        const methodSelect = document.getElementById("jitAuthMethodSelect");
        if (methodSelect) {
            // Remove any existing listener by cloning and replacing
            const newMethodSelect = methodSelect.cloneNode(true);
            methodSelect.parentNode.replaceChild(newMethodSelect, methodSelect);

            // Add change listener
            document
                .getElementById("jitAuthMethodSelect")
                .addEventListener("change", () => {
                    this.updateContactInputPlaceholder();
                });
        }
    }

    /**
     * Get display-friendly name for authentication method
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
     * Update contact input placeholder based on selected method
     */
    updateContactInputPlaceholder() {
        const contactInput = document.getElementById("jitVerificationContact");
        const methodSelect = document.getElementById("jitAuthMethodSelect");

        if (contactInput && methodSelect) {
            const selectedIndex = parseInt(methodSelect.value);
            const method = this.authMethods[selectedIndex];

            if (method) {
                const channel = method.challenge_channel;
                if (channel === "email") {
                    contactInput.type = "email";
                    contactInput.placeholder = "Enter your email address";
                } else if (channel === "sms" || channel === "phone") {
                    contactInput.type = "tel";
                    contactInput.placeholder = "Enter your phone number";
                } else {
                    contactInput.type = "text";
                    contactInput.placeholder = "Enter verification contact";
                }
            }
        }
    }

    /**
     * Show the form card
     */
    show() {
        const card = document.getElementById(this.cardId);
        if (card) {
            card.style.display = "block";
            console.log(`Showing JIT method selection form`);
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
     * Get the currently selected authentication method
     * @returns {Object} Selected method object
     */
    getSelectedMethod() {
        const methodSelect = document.getElementById("jitAuthMethodSelect");
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
     * Get the verification contact entered by user
     * @returns {string} Verification contact (email or phone)
     */
    getVerificationContact() {
        const contactInput = document.getElementById("jitVerificationContact");
        return contactInput ? contactInput.value.trim() : "";
    }

    /**
     * Set loading state for the form
     * @param {boolean} loading - Whether the form is in loading state
     */
    setLoading(loading) {
        this.isLoading = loading;

        const submitBtn = document.getElementById("submitJitMethodBtn");
        const cancelBtn = document.getElementById("cancelJitMethodBtn");
        const methodSelect = document.getElementById("jitAuthMethodSelect");
        const contactInput = document.getElementById("jitVerificationContact");

        if (submitBtn) {
            submitBtn.disabled = loading;
            submitBtn.textContent = loading ? "Processing..." : "Continue";
        }

        if (cancelBtn) cancelBtn.disabled = loading;
        if (methodSelect) methodSelect.disabled = loading;
        if (contactInput) contactInput.disabled = loading;
    }

    /**
     * Clear the form inputs
     */
    clear() {
        const contactInput = document.getElementById("jitVerificationContact");
        if (contactInput) {
            contactInput.value = "";
        }
        this.verificationContact = "";
        this.setLoading(false);
    }

    /**
     * Setup event listener for method selection change
     * @param {Function} callback - Callback to execute when method changes
     */
    onMethodChange(callback) {
        const methodSelect = document.getElementById("jitAuthMethodSelect");
        if (methodSelect) {
            methodSelect.addEventListener("change", () => {
                this.updateContactInputPlaceholder();
                if (callback) callback(this.getSelectedMethod());
            });
        }
    }
}
