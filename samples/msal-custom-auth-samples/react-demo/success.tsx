import React from "react";
import { useCustomAuth } from "./hooks/useCustomAuth"; // Assuming this hook is in this path

export const SuccessPage = () => {
    const { user } = useCustomAuth();

    if (!user) {
        return <div className="loading">Loading user data...</div>;
    }

    return (
        <div className="success-container">
            <h2>Sign In Successful!</h2>
            <p>Welcome, {user.displayName || user.username}!</p>

            <div className="user-profile">
                <h3>User Profile</h3>
                {user.profileImage && (
                    <div className="profile-image">
                        <img src={user.profileImage} alt="Profile" />
                    </div>
                )}

                <div className="user-details">
                    <p>
                        <strong>Username:</strong> {user.username}
                    </p>
                    {user.email && (
                        <p>
                            <strong>Email:</strong> {user.email}
                        </p>
                    )}
                    {user.fullName && (
                        <p>
                            <strong>Full Name:</strong> {user.fullName}
                        </p>
                    )}
                    {user.accountType && (
                        <p>
                            <strong>Account Type:</strong> {user.accountType}
                        </p>
                    )}
                    {user.memberSince && (
                        <p>
                            <strong>Member Since:</strong>{" "}
                            {new Date(user.memberSince).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};
