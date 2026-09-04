import React, { useState } from "react";
import { loginRequest, nestedAppPort, nestedAppProtocol } from "./authConfig";

/**
 * Host (top-frame) app UI. Signs the user in through the platform broker, then
 * embeds the nested app in an iframe. Once the host has an account, the nested
 * app can acquire tokens through the NAA bridge.
 */
function App({ pca }) {
    const [account, setAccount] = useState(pca.getActiveAccount());
    const [error, setError] = useState(null);

    const login = async () => {
        setError(null);
        try {
            const result = await pca.acquireTokenPopup(loginRequest);
            pca.setActiveAccount(result.account);
            setAccount(result.account);
        } catch (e) {
            setError(String(e));
        }
    };

    return (
        <div>
            <h2>NAA Host App</h2>
            <button onClick={login}>Login</button>
            {error && <pre style={{ color: "red" }}>{error}</pre>}
            {account && <p>Signed in as {account.username}</p>}
            <iframe
                title="nestedApp"
                src={`${nestedAppProtocol}://localhost:${nestedAppPort}`}
                style={{ width: "100%", height: "400px", border: "1px solid" }}
            />
        </div>
    );
}

export default App;
