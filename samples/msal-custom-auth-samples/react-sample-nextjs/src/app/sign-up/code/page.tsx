"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
    AuthFlowStateHandlerFactory,
    SignUpCodeRequired,
    SignUpCompleted,
    SignUpState,
} from "@azure/msal-custom-auth";
import router from "next/router";

export default function CodePage() {
    const { authState, setAuthState } = useAuth();
    const [code, setCode] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmitCode = async () => {
        if (authState instanceof SignUpCodeRequired) {
            const handler = AuthFlowStateHandlerFactory.create(authState);
            const result = await handler.submitCode(code);
            setAuthState(result.state);
            if (result.state instanceof SignUpCompleted) {
                setMessage("Sign-up successful!");
                // Sample codes for sign-in after sign-up
                // const signInHandler = AuthFlowStateHandlerFactory.create(result.state);
                // const signInResult = await signInHandler.signIn();
            } else if (result.state?.type === SignUpState.PasswordRequired) {
                router.push("/sign-up/password");
            } else if (result.state?.type === SignUpState.AttributesRequired) {
                router.push("/sign-up/attributes");
            } else if (result.state?.type === SignUpState.Failed) {
                if (result.error?.isInvalidCode()) {
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
                <h1>Enter Code</h1>
                <input
                    type="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                />
                <button onClick={handleSubmitCode}>Submit</button>
                {error && <p style={{ color: "red" }}>{error}</p>}
                {message && <p>{message}</p>}
            </div>
        </main>
    );
}
