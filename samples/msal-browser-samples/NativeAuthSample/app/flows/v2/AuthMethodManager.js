/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { formManager } from "../../ui/FormManager.js";

class AuthMethodManagerV2 {
    constructor() {
        this.listeners = [];
    }

    /**
     * Shows the existing method or challenge card for a V2 authentication state.
     * Operations and cancellation remain owned by the active flow module.
     */
    show(state, runOperation, cancel) {
        if (
            ![
                "authMethodRegistrationRequired",
                "authMethodVerificationRequired",
                "authMethodSelectionRequired",
                "mfaVerificationRequired",
            ].includes(state.stateType)
        ) {
            return false;
        }
        this.removeHandlers();
        if (state.stateType === "authMethodRegistrationRequired") {
            const select = document.getElementById("jitAuthMethodSelect");
            select.replaceChildren();
            for (const method of state.methods) {
                const option = document.createElement("option");
                option.value = method.type;
                option.textContent = method.type;
                select.appendChild(option);
            }
            const updateContact = () => {
                const type = select.value;
                const input = document.getElementById("jitVerificationContact");
                input.type =
                    type === "email"
                        ? "email"
                        : type === "sms"
                        ? "tel"
                        : "text";
            };
            this.#listen(select, "change", updateContact);
            updateContact();
            this.#bind(
                "jitMethodSelectionForm",
                "submitJitMethodBtn",
                "cancelJitMethodBtn",
                "Registering...",
                (data) => {
                    const method = state.methods.find(
                        ({ type }) => type === data.get("authMethod")
                    );
                    if (!method) {
                        throw new Error(
                            "Select an available registration method."
                        );
                    }
                    return state.selectAuthMethod(
                        method,
                        data.get("contact").trim()
                    );
                },
                runOperation,
                cancel
            );
            formManager.showForm("jitMethodSelectionCard", {
                focusInputId: "jitVerificationContact",
            });
        } else if (state.stateType === "authMethodSelectionRequired") {
            const select = document.getElementById("mfaAuthMethodSelect");
            select.replaceChildren();
            for (const method of state.methods) {
                const option = document.createElement("option");
                option.value = method.id;
                option.textContent = method.hint
                    ? `${method.type} (${method.hint})`
                    : method.type;
                select.appendChild(option);
            }
            document.querySelector("#mfaMethodSelectionCard h2").textContent =
                "Select Authentication Method";
            document.getElementById("mfaMethodInstructions").textContent =
                "Select an available method to continue:";
            this.#bind(
                "mfaMethodSelectionForm",
                "submitMfaMethodBtn",
                "cancelMfaMethodBtn",
                "Continuing...",
                (data) => {
                    const method = state.methods.find(
                        ({ id }) => id === data.get("mfaMethod")
                    );
                    if (!method) {
                        throw new Error(
                            "Select an available authentication method."
                        );
                    }
                    return state.selectAuthMethod(method);
                },
                runOperation,
                cancel
            );
            formManager.showForm("mfaMethodSelectionCard", {
                focusInputId: "mfaAuthMethodSelect",
            });
        } else {
            const prefix =
                state.stateType === "authMethodVerificationRequired"
                    ? "jit"
                    : "mfa";
            const buttonId =
                prefix === "jit"
                    ? "submitJitChallengeBtn"
                    : "submitMfaChallengeBtn";
            const cancelId =
                prefix === "jit"
                    ? "cancelJitChallengeBtn"
                    : "cancelMfaChallengeBtn";
            document.getElementById(
                `${prefix}ChallengeInstructions`
            ).textContent = state.sentTo
                ? `Enter the verification code sent to ${state.sentTo}:`
                : "Enter the verification code sent to your selected contact:";
            document.getElementById(`${prefix}ChallengeCode`).maxLength =
                state.codeLength ?? 8;
            this.#bind(
                `${prefix}ChallengeForm`,
                buttonId,
                cancelId,
                "Verifying...",
                (data) => state.submitChallenge(data.get("code")),
                runOperation,
                cancel
            );
            formManager.showForm(`${prefix}ChallengeCard`, {
                clearInputs: true,
                focusInputId: `${prefix}ChallengeCode`,
            });
        }
        return true;
    }

    /**
     * Removes the previous flow's listeners and clears method/challenge inputs.
     * Call this when navigating away or when authentication leaves these states.
     */
    removeHandlers() {
        for (const { element, event, handler } of this.listeners) {
            element.removeEventListener(event, handler);
        }
        this.listeners = [];
        for (const card of [
            "jitMethodSelectionCard",
            "jitChallengeCard",
            "mfaMethodSelectionCard",
            "mfaChallengeCard",
        ]) {
            formManager.clearFormInputs(card);
        }
        for (const [id, label] of [
            ["submitJitMethodBtn", "Continue"],
            ["submitJitChallengeBtn", "Verify Code"],
            ["submitMfaMethodBtn", "Continue"],
            ["submitMfaChallengeBtn", "Verify Code"],
        ]) {
            const button = document.getElementById(id);
            button.disabled = false;
            button.textContent = label;
        }
    }

    #listen(element, event, handler) {
        element.addEventListener(event, handler);
        this.listeners.push({ element, event, handler });
    }

    #bind(
        formId,
        buttonId,
        cancelId,
        loadingText,
        action,
        runOperation,
        cancel
    ) {
        this.#listen(document.getElementById(formId), "submit", (event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            runOperation(buttonId, loadingText, () => action(data));
        });
        this.#listen(document.getElementById(cancelId), "click", cancel);
    }
}

export const authMethodManagerV2 = new AuthMethodManagerV2();
