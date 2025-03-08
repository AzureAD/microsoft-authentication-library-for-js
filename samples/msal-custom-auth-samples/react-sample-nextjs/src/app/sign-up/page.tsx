"use client";

import { useState } from "react";
import { CustomAuthPublicClientApplication } from "../../../../../../lib/msal-custom-auth/src";
import { SignUpState } from "../../../../../../lib/msal-custom-auth/src";
import { UserAccountAttributes } from "../../../../../../lib/msal-custom-auth/src";
import { customAuthConfig } from "../../config/auth-config";
import { styles } from "./styles/styles";
import { InitialForm } from "./components/InitialForm";
import { CodeForm } from "./components/CodeForm";
import { SignUpResult } from "./components/SignUpResult";

export default function SignUp() {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [flowState, setFlowState] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [signUpResult, setSignUpResult] = useState<any>(null);

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const app = await CustomAuthPublicClientApplication.create(customAuthConfig);

            const attributes = new UserAccountAttributes();
            attributes.setDisplayName(`${firstName} ${lastName}`);

            const result = await app.signUp({
                username: email,
                attributes,
            });

            if (result.error) {
                if (result.error.isUserAlreadyExists()) {
                    setError("An account with this email already exists");
                } else {
                    setError("An error occurred during sign up");
                }
                return;
            }

            setFlowState(result.state);
        } catch (err) {
            setError("An unexpected error occurred");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCodeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await flowState.submitCode(code);

            if (result.error) {
                if (result.error.isInvalidCode()) {
                    setError("Invalid verification code");
                } else {
                    setError("An error occurred while verifying the code");
                }
                return;
            }

            if (result.state?.type === SignUpState.Completed) {
                const signInResult = await flowState.signIn();
                if (signInResult.error) {
                    setError("Sign up successful but automatic sign in failed");
                    return;
                }
                setSignUpResult(signInResult);
                return;
            }

            setFlowState(result.state);
        } catch (err) {
            setError("An unexpected error occurred");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (signUpResult) {
        return <SignUpResult result={signUpResult} />;
    }

    return (
        <div style={styles.container}>
            <h2>Sign Up</h2>
            {flowState?.type === SignUpState.CodeRequired ? (
                <CodeForm onSubmit={handleCodeSubmit} code={code} setCode={setCode} loading={loading} />
            ) : (
                <InitialForm
                    onSubmit={handleInitialSubmit}
                    firstName={firstName}
                    setFirstName={setFirstName}
                    lastName={lastName}
                    setLastName={setLastName}
                    email={email}
                    setEmail={setEmail}
                    loading={loading}
                />
            )}
            {error && <div style={styles.error}>{error}</div>}
        </div>
    );
}
