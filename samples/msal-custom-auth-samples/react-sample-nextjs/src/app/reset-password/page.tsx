"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { customAuthConfig } from "../../config/auth-config";
import { styles } from "./styles/styles";
import { InitialForm } from "./components/InitialForm";
import { CodeForm } from "./components/CodeForm";
import { NewPasswordForm } from "./components/NewPasswordForm";
import { ResetPasswordResult } from "./components/ResetPasswordResult";
import {
    AuthFlowStateHandlerFactory,
    CustomAuthPublicClientApplication,
    ResetPasswordState,
    ResetPasswordCodeRequired,
    ResetPasswordPasswordRequired,
    ResetPasswordCompleted,
} from "@azure/msal-custom-auth";

export default function ResetPassword() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [error, setError] = useState("");
    const [flowState, setFlowState] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [resetResult, setResetResult] = useState<any>(null);

    const handleInitialSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const app = await CustomAuthPublicClientApplication.create(customAuthConfig);
            const result = await app.resetPassword({
                username: email,
            });

            if (result.error) {
                setError(
                    result.error.errorData.errorDescription || "An error occurred while initiating password reset"
                );
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
            if (flowState instanceof ResetPasswordCodeRequired) {
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

                setFlowState(result.state);
            }
        } catch (err) {
            setError("An unexpected error occurred");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleNewPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (flowState instanceof ResetPasswordPasswordRequired) {
                const handler = AuthFlowStateHandlerFactory.create(flowState);
                const result = await handler.submitNewPassword(newPassword);

                if (result.error) {
                    setError(result.error.errorData.errorDescription || "An error occurred while setting new password");
                    return;
                }

                if (result.state instanceof ResetPasswordCompleted) {
                    setResetResult(result.state);
                }
            }
        } catch (err) {
            setError("An unexpected error occurred");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (resetResult) {
        return <ResetPasswordResult result={resetResult} />;
    }

    return (
        <div style={styles.container}>
            <h2>Reset Password</h2>
            {flowState instanceof ResetPasswordPasswordRequired ? (
                <NewPasswordForm
                    onSubmit={handleNewPasswordSubmit}
                    newPassword={newPassword}
                    setNewPassword={setNewPassword}
                    loading={loading}
                />
            ) : flowState instanceof ResetPasswordCodeRequired ? (
                <CodeForm onSubmit={handleCodeSubmit} code={code} setCode={setCode} loading={loading} />
            ) : (
                <InitialForm onSubmit={handleInitialSubmit} email={email} setEmail={setEmail} loading={loading} />
            )}
            {error && <div style={styles.error}>{error}</div>}
        </div>
    );
}
