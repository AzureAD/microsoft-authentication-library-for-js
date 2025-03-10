"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { SignUpState } from "@azure/msal-custom-auth";

export default function SignUp() {
    const { app, setAuthState } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSignUp = async () => {
        if (!app) return;

        const result = await app.signUp({
            username: "abc@test.com",
        });
        setAuthState(result.state); // Update the auth state in the context

        if (!result.state) {
            setError("No state returned from sign-in.");
            return;
        }

        if (result.state.type === SignUpState.Failed) {
            if (result.error?.isInvalidUsername()) {
                setError("Invalid username.");
            } else {
                setError(result.error?.errorData?.message || "Unknown error.");
            }
        } else if (result.state.type === SignUpState.PasswordRequired) {
            router.push("/sign-up/password");
        } else if (result.state.type === SignUpState.CodeRequired) {
            router.push("/sign-up/code");
        } else if (result.state.type === SignUpState.AttributesRequired) {
            router.push("/sign-up/attributes");
        } else {
            setError("Unknown sign-up state.");
        }
    };

    return (
        <div className="auth-container">
            <h2>Sign Up</h2>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <button onClick={handleSignUp}>Sign Up</button>
        </div>
    );
}
