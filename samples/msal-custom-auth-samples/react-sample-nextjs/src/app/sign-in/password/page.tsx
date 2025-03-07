"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
    AuthFlowStateHandlerFactory,
    SignInPasswordRequired,
    SignInState,
} from "@azure/msal-custom-auth";

export default function PasswordPage() {
    const { authState, setAuthState } = useAuth();
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSubmitPassword = async () => {
        if (authState instanceof SignInPasswordRequired) {
            const handler = AuthFlowStateHandlerFactory.create(authState);
            const result = await handler.submitPassword(password);
            setAuthState(result.state);
            if (result.state?.type === SignInState.Completed) {
                setMessage(
                    result.data?.getAccount()?.idToken ?? "Sign-in successful!"
                );
            } else if (result.state?.type === SignInState.Failed) {
                setError(result.error?.errorData?.message ?? "Sign-in failed.");
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
