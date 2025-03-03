"use client";

import { useState } from "react";
import { CustomAuthPublicClientApplication } from "../../../../../../lib/msal-custom-auth";
import { SignUpState } from "../../../../../../lib/msal-custom-auth";
import { UserAccountAttributes } from "../../../../../../lib/msal-custom-auth";
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

export default function SignUp() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [displayName, setDisplayName] = useState("");
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

            const attributes = new UserAccountAttributes();
            if (displayName) {
                attributes.setDisplayName(displayName);
            }

            const result = await app.signUp({
                username,
                ...(password ? { password } : {}),
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
            const handler = flowState;
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
            const handler = flowState;
            const result = await handler.submitPassword(password);

            if (result.error) {
                setError("An error occurred while setting the password");
                return;
            }

            if (result.state?.type === SignUpState.Completed) {
                const signInResult = await handler.signIn();
                if (signInResult.error) {
                    setError("Sign up successful but automatic sign in failed");
                    return;
                }
                // Redirect to home on successful sign up and sign in
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

    const handleAttributesSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const handler = flowState;
            const attributes = new UserAccountAttributes();
            attributes.setDisplayName(displayName);

            const result = await handler.submitAttributes(attributes);

            if (result.error) {
                setError("An error occurred while setting user attributes");
                return;
            }

            if (result.state?.type === SignUpState.Completed) {
                const signInResult = await handler.signIn();
                if (signInResult.error) {
                    setError("Sign up successful but automatic sign in failed");
                    return;
                }
                // Redirect to home on successful sign up and sign in
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
            <input
                type="text"
                placeholder="Display Name (optional)"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={styles.input}
            />
            <button type="submit" style={styles.button} disabled={loading}>
                {loading ? "Signing up..." : "Sign Up"}
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
                {loading ? "Setting password..." : "Set Password"}
            </button>
        </form>
    );

    const renderAttributesForm = () => (
        <form onSubmit={handleAttributesSubmit} style={styles.form}>
            <input
                type="text"
                placeholder="Display Name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={styles.input}
                required
            />
            <button type="submit" style={styles.button} disabled={loading}>
                {loading ? "Saving..." : "Save Profile"}
            </button>
        </form>
    );

    const renderForm = () => {
        if (!flowState) {
            return renderInitialForm();
        }

        switch (flowState.type) {
            case SignUpState.CodeRequired:
                return renderCodeForm();
            case SignUpState.PasswordRequired:
                return renderPasswordForm();
            case SignUpState.AttributesRequired:
                return renderAttributesForm();
            default:
                return renderInitialForm();
        }
    };

    return (
        <div style={styles.container}>
            <h2>Sign Up</h2>
            {renderForm()}
            {error && <div style={styles.error}>{error}</div>}
        </div>
    );
}
