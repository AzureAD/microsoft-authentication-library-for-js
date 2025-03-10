"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
    AuthFlowStateHandlerFactory,
    SignUpAttributesRequired,
    SignUpCompleted,
    SignUpState,
    UserAccountAttributes,
} from "@azure/msal-custom-auth";
import router from "next/router";

export default function AttributesPage() {
    const { authState, setAuthState } = useAuth();
    const [displayName, setDisplayName] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmitAttributes = async () => {
        if (authState instanceof SignUpAttributesRequired) {
            const attributes = new UserAccountAttributes();
            attributes.setDisplayName(displayName);

            const handler = AuthFlowStateHandlerFactory.create(authState);
            const result = await handler.submitAttributes(attributes);
            setAuthState(result.state);
            if (result.state instanceof SignUpCompleted) {
                setMessage("Sign-up successful!");
                // Sample codes for sign-in after sign-up
                // const signInHandler = AuthFlowStateHandlerFactory.create(result.state);
                // const signInResult = await signInHandler.signIn();
            } else if (result.state?.type === SignUpState.PasswordRequired) {
                router.push("/sign-up/password");
            } else if (result.state?.type === SignUpState.Failed) {
                if (result.error?.isMissingRequiredAttributes()) {
                    setError("Required attributes are missing.");
                }
                if (result.error?.isAttributesValidationFailed()) {
                    setError("Attributes validation failed.");
                } else {
                    setError(
                        result.error?.errorData?.message || "Unknown error."
                    );
                }
            }
        }
    };

    return (
        <main>
            <div className="auth-container">
                <h1>Enter Attributes</h1>
                <input
                    type="input"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                />
                <button onClick={handleSubmitAttributes}>Submit</button>
                {error && <p style={{ color: "red" }}>{error}</p>}
                {message && <p>{message}</p>}
            </div>
        </main>
    );
}
