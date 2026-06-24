/*
 * Form Manager for MSAL Native Auth Sample
 *
 * Centralized form visibility management to reduce repetitive show/hide logic.
 * This manager handles all form card visibility with a simple API.
 */

export class FormManager {
    constructor() {
        // Define all form card IDs in the application
        this.formCards = [
            "signInCard",
            "signUpCard",
            "resetPasswordCard",
            "signUpPasswordCard",
            "resetPasswordNewPasswordCard",
            "codeVerificationCard",
            "passwordInputCard",
            "jitMethodSelectionCard",
            "jitChallengeCard",
            "mfaMethodSelectionCard",
            "mfaChallengeCard",
        ];
    }

    /**
     * Show a specific form and hide all others
     * @param {string} formId - The ID of the form to show
     * @param {Object} options - Optional configuration
     * @param {Function} options.onShow - Callback after showing form
     * @param {boolean} options.clearInputs - Whether to clear form inputs (default: false)
     * @param {string} options.focusInputId - ID of input to focus after showing
     */
    showForm(formId, options = {}) {
        // Hide all forms first
        this.hideAllForms();

        // Show the requested form
        const form = document.getElementById(formId);
        if (!form) {
            console.warn(`Form not found: ${formId}`);
            return;
        }

        form.style.display = "block";

        // Handle optional behaviors
        if (options.clearInputs) {
            this.clearFormInputs(formId);
        }

        if (options.focusInputId) {
            const input = document.getElementById(options.focusInputId);
            if (input) {
                input.focus();
            }
        }

        // Execute callback if provided
        if (options.onShow) {
            options.onShow(form);
        }
    }

    /**
     * Hide all forms
     */
    hideAllForms() {
        this.formCards.forEach((cardId) => {
            const card = document.getElementById(cardId);
            if (card) {
                card.style.display = "none";
            }
        });
    }

    /**
     * Hide specific forms
     * @param {string[]} formIds - Array of form IDs to hide
     */
    hideForms(formIds) {
        formIds.forEach((formId) => {
            const form = document.getElementById(formId);
            if (form) {
                form.style.display = "none";
            }
        });
    }

    /**
     * Clear all inputs in a form
     * @param {string} formId - The form card ID
     */
    clearFormInputs(formId) {
        const form = document.getElementById(formId);
        if (!form) return;

        // Clear all input and textarea elements
        const inputs = form.querySelectorAll("input, textarea, select");
        inputs.forEach((input) => {
            if (input.type === "checkbox" || input.type === "radio") {
                input.checked = false;
            } else {
                input.value = "";
            }
        });
    }

    /**
     * Update text content of an element within a form
     * @param {string} elementId - The element ID
     * @param {string} text - The text to set
     */
    updateText(elementId, text) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = text;
        }
    }

    /**
     * Check if a form is currently visible
     * @param {string} formId - The form ID to check
     * @returns {boolean} True if form is visible
     */
    isFormVisible(formId) {
        const form = document.getElementById(formId);
        return form && form.style.display !== "none";
    }
}

// Create singleton instance
export const formManager = new FormManager();
