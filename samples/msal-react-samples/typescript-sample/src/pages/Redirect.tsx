// This page serves the redirect bridge for MSAL authentication
// It's excluded from MsalProvider wrapper in App.tsx to prevent MSAL from processing the hash
import { useEffect } from "react";
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

export function Redirect() {
    useEffect(() => {
        // Call broadcastResponseToMainFrame when component mounts
        broadcastResponseToMainFrame().catch((error) => {
            console.error("Error broadcasting response to main frame:", error);
        });
    }, []);

    return (
        <div>
            <p>Processing authentication...</p>
        </div>
    );
}

