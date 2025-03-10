import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCustomAuth } from "./hooks/useCustomAuth"; // Assuming this hook is in this path

export const SignIn = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const { startSignIn, status, errorCode, errorMessage } = useCustomAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await startSignIn(username, password);

            if (result === "SignIn.Completed") {
                navigate("/success");
            } else if (result === "SignIn.ChallengeRequired") {
                navigate("/challenge");
            }
        } catch (error) {
            console.error("Sign in error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="sign-in-container">
            <h2>Sign In</h2>

            {errorMessage && (
                <div className="error-message">{errorMessage}</div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Signing in..." : "Sign In"}
                </button>
            </form>
        </div>
    );
};
