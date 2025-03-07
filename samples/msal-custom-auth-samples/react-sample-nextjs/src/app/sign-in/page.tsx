"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { SignInState } from "@azure/msal-custom-auth";

export default function SignInPage() {
    const { app, setAuthState } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();

    const handleSignIn = async () => {
        if (!app) return;

        const result = await app.signIn({
            username: "abc@test.com",
        });
        setAuthState(result.state); // Update the auth state in the context

        if (!result.state) {
            setError("No state returned from sign-in.");
            return;
        }

        if (result.state.type === SignInState.Completed) {
            setMessage("Sign-in successful!");
        } else if (result.state.type === SignInState.Failed) {
            if (result.error?.isInvalidUsername()) {
                setError("Invalid username.");
            } else if (result.error?.isUserNotFound()) {
                setError("User not found.");
            } else {
                setError(result.error?.errorData?.message || "Unknown error.");
            }
        } else if (result.state.type === SignInState.PasswordRequired) {
            router.push("/sign-in/password");
        } else if (result.state.type === SignInState.CodeRequired) {
            router.push("/sign-in/code");
        } else {
            setError("Unknown sign-in state.");
        }
    };

    return (
        <main>
            <div className="auth-container">
                <h2>Sign In</h2>
                {error && <p style={{ color: "red" }}>{error}</p>}
                {message && <p style={{ color: "green" }}>{message}</p>}
                <button onClick={handleSignIn}>Sign In</button>
            </div>
        </main>
    );
}
