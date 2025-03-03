"use client";

import { useState } from "react";
import { CustomAuthPublicClientApplication } from "../../../../../../lib/msal-custom-auth";
import { SignInState } from "../../../../../../lib/msal-custom-auth";
import { customAuthConfig } from "../../config/auth-config";

const styles = {
    container: {
        maxWidth: "400px",
        margin: "40px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: "15px",
    },
    input: {
        padding: "8px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        fontSize: "16px",
    },
    button: {
        padding: "10px",
        backgroundColor: "#0078d4",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "16px",
    },
    error: {
        color: "#d13438",
        marginTop: "10px",
    },
} as const;

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
                // Redirect to home or dashboard
                window.location.href = "/";
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
                    setError("Invalid code");
                } else {
                    setError("An error occurred while verifying the code");
                }
                return;
            }

            if (result.data) {
                // Redirect to home or dashboard
                window.location.href = "/";
            }
        } catch (err) {
            setError("An unexpected error occurred");
            console.error(err);
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
                // Redirect to home or dashboard
                window.location.href = "/";
            }
        } catch (err) {
            setError("An unexpected error occurred");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderInitialForm = () => (
        <form onSubmit={handleInitialSubmit} style={styles.form}>
            <input
                type="email"
                placeholder="Email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={styles.input}
                required
            />
            <input
                type="password"
                placeholder="Password (optional)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
            />
            <button type="submit" style={styles.button} disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
            </button>
        </form>
    );

    const renderCodeForm = () => (
        <form onSubmit={handleCodeSubmit} style={styles.form}>
            <input
                type="text"
                placeholder="Enter verification code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                style={styles.input}
                required
            />
            <button type="submit" style={styles.button} disabled={loading}>
                {loading ? "Verifying..." : "Verify Code"}
            </button>
        </form>
    );

    const renderPasswordForm = () => (
        <form onSubmit={handlePasswordSubmit} style={styles.form}>
            <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
            />
            <button type="submit" style={styles.button} disabled={loading}>
                {loading ? "Verifying..." : "Submit Password"}
            </button>
        </form>
    );

    const renderForm = () => {
        if (!flowState) {
            return renderInitialForm();
        }

        switch (flowState.type) {
            case SignInState.CodeRequired:
                return renderCodeForm();
            case SignInState.PasswordRequired:
                return renderPasswordForm();
            default:
                return renderInitialForm();
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
