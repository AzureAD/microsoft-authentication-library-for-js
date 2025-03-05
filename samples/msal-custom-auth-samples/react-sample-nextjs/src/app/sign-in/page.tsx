"use client";

import { useState } from "react";
import { CustomAuthPublicClientApplication } from "../../../../../../lib/msal-custom-auth";
import { SignInState } from "../../../../../../lib/msal-custom-auth";
import { customAuthConfig } from "../../config/auth-config";
import { styles } from "./styles/styles";
import { handleError, redirectToHome, ERROR_MESSAGES } from "./utils";
import { InitialForm } from "./components/InitialForm";
import { CodeForm } from "./components/CodeForm";
import { PasswordForm } from "./components/PasswordForm";

export default function SignIn() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [flowState, setFlowState] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const app = await CustomAuthPublicClientApplication.create(
                customAuthConfig
            );
            const result = await app.signIn({
                username,
                ...(password ? { password } : {}),
            });

            if (result.error) {
                if (result.error.isUserNotFound()) {
                    setError("User not found");
                } else if (result.error.isPasswordIncorrect()) {
                    setError("Incorrect password");
                } else {
                    setError("An error occurred during sign in");
                }
                return;
            }

            if (result.state?.type === SignInState.Completed) {
                redirectToHome();
                return;
            }

            setFlowState(result.state);
        } catch (err) {
            handleError(err, setError);
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
                    setError("Invalid code");
                } else {
                    setError("An error occurred while verifying the code");
                }
                return;
            }

            if (result.data) {
                redirectToHome();
            }
        } catch (err) {
            handleError(err, setError);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const result = await flowState.submitPassword(password);

            if (result.error) {
                if (result.error.isPasswordIncorrect()) {
                    setError("Incorrect password");
                } else {
                    setError("An error occurred while verifying the password");
                }
                return;
            }

            if (result.data) {
                redirectToHome();
            }
        } catch (err) {
            handleError(err, setError);
        } finally {
            setLoading(false);
        }
    };

    const renderForm = () => {
        if (!flowState) {
            return (
                <InitialForm
                    onSubmit={handleInitialSubmit}
                    username={username}
                    setUsername={setUsername}
                    password={password}
                    setPassword={setPassword}
                    loading={loading}
                />
            );
        }

        switch (flowState.type) {
            case SignInState.CodeRequired:
                return (
                    <CodeForm
                        onSubmit={handleCodeSubmit}
                        code={code}
                        setCode={setCode}
                        loading={loading}
                    />
                );
            case SignInState.PasswordRequired:
                return (
                    <PasswordForm
                        onSubmit={handlePasswordSubmit}
                        password={password}
                        setPassword={setPassword}
                        loading={loading}
                    />
                );
            default:
                return (
                    <InitialForm
                        onSubmit={handleInitialSubmit}
                        username={username}
                        setUsername={setUsername}
                        password={password}
                        setPassword={setPassword}
                        loading={loading}
                    />
                );
        }
    };

    return (
        <div style={styles.container}>
            <h2>Sign In</h2>
            {renderForm()}
            {error && <div style={styles.error}>{error}</div>}
        </div>
    );
}
