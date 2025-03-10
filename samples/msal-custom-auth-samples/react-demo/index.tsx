import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

const App = () => {
    return (
        <div className="app">
            <Routes>
                <Route path="/signin" element={<SignIn />} />
                <Route path="/challenge" element={<SignInChallenge />} />
                <Route
                    path="/success"
                    element={
                        <ProtectedRoute>
                            <SuccessPage />
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/signin" />} />
            </Routes>
        </div>
    );
};

export default App;
