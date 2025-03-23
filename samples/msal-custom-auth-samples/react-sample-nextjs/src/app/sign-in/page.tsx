"use client";

import { useState } from "react";
import { CustomAuthPublicClientApplication } from "@azure/msal-custom-auth";
import { SignInState } from "@azure/msal-custom-auth";
import { customAuthConfig } from "../../config/auth-config";
import { styles } from "./styles/styles";
import { handleError } from "./utils";
import { InitialForm } from "./components/InitialForm";
import { PasswordForm } from "./components/PasswordForm";
import { CodeForm } from "./components/CodeForm";
import { UserInfo } from "./components/UserInfo";
import { AuthFlowStateHandlerFactory, SignInCodeRequired, SignInPasswordRequired } from "@azure/msal-custom-auth";

export default function SignIn() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [flowState, setFlowState] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [signInResult, setSignInResult] = useState<any>(null);

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const app = await CustomAuthPublicClientApplication.create(customAuthConfig);
            const result = await app.signIn({
                username,
            });

            if (result.error) {
                if (result.error.isUserNotFound()) {
                    setError("User not found");
                } else {
                    setError("An error occurred during sign in");
                }
                return;
            }

            if (result.state?.type === SignInState.Completed) {
                setSignInResult(result);
                setFlowState(result.state);
                return;
            }

            setFlowState(result.state);
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
            if (flowState instanceof SignInPasswordRequired) {
                const handler = AuthFlowStateHandlerFactory.create(flowState);
                const result = await handler.submitPassword(password);

                if (result.error) {
                    if (result.error.errorData?.error === "invalid_password") {
                        setError("Incorrect password");
                    } else {
                        setError(
                            result.error.errorData?.errorDescription || "An error occurred while verifying the password"
                        );
                    }
                    return;
                }

                if (result.state?.type === SignInState.Completed) {
                    setSignInResult(result);
                    setFlowState(result.state);
                    return;
                }

                setFlowState(result.state);
            }
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
            if (flowState instanceof SignInCodeRequired) {
                const handler = AuthFlowStateHandlerFactory.create(flowState);
                const result = await handler.submitCode(code);

                if (result.error) {
                    if (result.error.isInvalidCode()) {
                        setError("Invalid code");
                    } else {
                        setError("An error occurred while verifying the code");
                    }
                    return;
                }

                if (result.state?.type === SignInState.Completed) {
                    setSignInResult(result);
                    setFlowState(result.state);
                    return;
                }
            }
        } catch (err) {
            handleError(err, setError);
        } finally {
            setLoading(false);
        }
    };

    const renderForm = () => {
        if (flowState?.type === SignInState.PasswordRequired) {
            return (
                <PasswordForm
                    onSubmit={handlePasswordSubmit}
                    password={password}
                    setPassword={setPassword}
                    loading={loading}
                />
            );
        }
        if (flowState?.type === SignInState.CodeRequired) {
            return <CodeForm onSubmit={handleCodeSubmit} code={code} setCode={setCode} loading={loading} />;
        }
        if (flowState?.type === SignInState.Completed) {
            return <UserInfo signInResult={signInResult} />;
        }

        return (
            <InitialForm
                onSubmit={handleInitialSubmit}
                username={username}
                setUsername={setUsername}
                loading={loading}
            />
        );
    };

    return (
        <div style={styles.container}>
            <h2>Sign In</h2>
            <>
                {renderForm()}
                {error && <div style={styles.error}>{error}</div>}
            </>
        </div>
    );
}
