"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
    AuthFlowStateHandlerFactory,
    SignUpCompleted,
    SignUpPasswordRequired,
    SignUpState,
} from "@azure/msal-custom-auth";
import router from "next/router";

export default function PasswordPage() {
    const { authState, setAuthState } = useAuth();
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmitPassword = async () => {
        if (authState instanceof SignUpPasswordRequired) {
            const handler = AuthFlowStateHandlerFactory.create(authState);
            const result = await handler.submitPassword(password);
            setAuthState(result.state);
            if (result.state instanceof SignUpCompleted) {
                setMessage("Sign-up successful!");
                // Sample codes for sign-in after sign-up
                // const signInHandler = AuthFlowStateHandlerFactory.create(result.state);
                // const signInResult = await signInHandler.signIn();
            } else if (result.state?.type === SignUpState.AttributesRequired) {
                router.push("/sign-up/attributes");
            } else if (result.state?.type === SignUpState.Failed) {
                if (result.error?.isInvalidPassword()) {
                    setError("Invalid password.");
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
                <h1>Enter Password</h1>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button onClick={handleSubmitPassword}>Submit</button>
                {error && <p style={{ color: "red" }}>{error}</p>}
                {message && <p>{message}</p>}
            </div>
        </main>
    );
}
