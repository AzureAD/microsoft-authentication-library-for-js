"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { customAuthConfig } from "../../config/auth-config";
import { styles } from "./styles/styles";
import { InitialFormWithPassword } from "./components/InitialFormWithPassword";
import { CodeForm } from "../sign-up/components/CodeForm";
import { SignUpResult } from "../sign-up/components/SignUpResult";
import {
    AuthFlowStateHandlerFactory,
    SignUpCodeRequired,
    CustomAuthPublicClientApplication,
    SignUpState,
    UserAccountAttributes,
} from "@azure/msal-custom-auth";
import { SignUpCompleted } from "@azure/msal-custom-auth";

export default function SignUpPassword() {
    const router = useRouter();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
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
                password: password,
                attributes,
            });

            if (result.error) {
                if (result.error.isUserAlreadyExists()) {
                    setError("An account with this email already exists");
                } else {
                    setError(result.error.errorData.errorDescription || "An error occurred while signing up");
                }
                return;
            }

            if (result.state instanceof SignUpCompleted) {
                setSignUpResult(result.state);
            } else {
                setFlowState(result.state);
            }
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
            if (flowState instanceof SignUpCodeRequired) {
                const handler = AuthFlowStateHandlerFactory.create(flowState);
                const result = await handler.submitCode(code);
                if (result.error) {
                    if (result.error.isInvalidCode()) {
                        setError("Invalid verification code");
                    } else {
                        setError("An error occurred while verifying the code");
                    }
                    return;
                }
                if (result.state instanceof SignUpCompleted) {
                    setSignUpResult(result.state);
                }
            }
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
            <h2>Sign Up with Password</h2>
            {flowState?.type === SignUpState.CodeRequired ? (
                <CodeForm onSubmit={handleCodeSubmit} code={code} setCode={setCode} loading={loading} />
            ) : (
                <InitialFormWithPassword
                    onSubmit={handleInitialSubmit}
                    firstName={firstName}
                    setFirstName={setFirstName}
                    lastName={lastName}
                    setLastName={setLastName}
                    email={email}
                    setEmail={setEmail}
                    password={password}
                    setPassword={setPassword}
                    loading={loading}
                />
            )}
            {error && <div style={styles.error}>{error}</div>}
        </div>
    );
}
