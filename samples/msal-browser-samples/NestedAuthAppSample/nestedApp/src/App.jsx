import React, { useState } from "react";
import { loginRequest } from "./authConfig";

/**
 * Nested (child) app UI. Acquires a token through the host's NAA bridge via
 * `acquireTokenSilent`, falling back to interactive `acquireTokenPopup` when a
 * silent token is unavailable. Renders the resulting account so the e2e harness
 * can detect the authenticated state (the `homeAccountId` table header).
 */
function App({ pca }) {
    const [account, setAccount] = useState(pca.getActiveAccount());
    const [error, setError] = useState(null);

    const acquireTokenSilent = async () => {
        setError(null);
        try {
            const result = await pca.acquireTokenSilent(loginRequest);
            pca.setActiveAccount(result.account);
            setAccount(result.account);
        } catch (e) {
            try {
                const result = await pca.acquireTokenPopup(loginRequest);
                pca.setActiveAccount(result.account);
                setAccount(result.account);
            } catch (popupError) {
                setError(String(popupError));
            }
        }
    };

    return (
        <div>
            <h2>NAA Nested App</h2>
            <button onClick={acquireTokenSilent}>acquireTokenSilent</button>
            {error && <pre style={{ color: "red" }}>{error}</pre>}
            {account && (
                <table>
                    <thead>
                        <tr>
                            <th>homeAccountId</th>
                            <th>username</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{account.homeAccountId}</td>
                            <td>{account.username}</td>
                        </tr>
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default App;
