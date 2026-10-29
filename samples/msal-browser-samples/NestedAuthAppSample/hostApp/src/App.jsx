import React, { useEffect, useState } from "react";
import { EventType } from "@azure/msal-browser";
import {
    loginRequest,
    nestedAppPort,
    nestedAppProtocol,
    isEarEnabled,
} from "./authConfig";

/**
 * Host (top-frame) app UI. Signs the user in through the platform broker, then
 * embeds the nested app in an iframe. Once the host has an account, the nested
 * app can acquire tokens through the NAA bridge.
 */
function App({ pca }) {
    const [account, setAccount] = useState(pca.getActiveAccount());
    const [error, setError] = useState(null);
    const [authResult, setAuthResult] = useState(null);

    useEffect(() => {
        const callbackId = pca.addEventCallback((event) => {
            if (
                (event.eventType === EventType.LOGIN_SUCCESS ||
                    event.eventType === EventType.ACQUIRE_TOKEN_SUCCESS) &&
                event.payload?.account
            ) {
                const result = event.payload;
                setAuthResult({
                    fromPlatformBroker: result.fromPlatformBroker === true,
                    correlationId: result.correlationId,
                    account: {
                        homeAccountId: result.account.homeAccountId,
                        nativeAccountId: result.account.nativeAccountId,
                    },
                    idTokenClaims: {
                        signin_state: result.idTokenClaims?.signin_state,
                    },
                });
            }
        });
        return () => {
            if (callbackId) {
                pca.removeEventCallback(callbackId);
            }
        };
    }, [pca]);

    const authenticate = (silent) => async () => {
        setError(null);
        setAuthResult(null);
        try {
            const result = silent
                ? await pca.ssoSilent(loginRequest)
                : await pca.acquireTokenPopup(loginRequest);
            pca.setActiveAccount(result.account);
            setAccount(result.account);
        } catch (e) {
            setError(String(e));
        }
    };

    return (
        <div>
            <h2>NAA Host App</h2>
            <button onClick={authenticate(false)}>Login</button>
            <button onClick={authenticate(true)}>ssoSilent</button>
            {error && (
                <pre data-testid="hostError" style={{ color: "red" }}>
                    {error}
                </pre>
            )}
            {account && <p>Signed in as {account.username}</p>}
            {authResult && (
                <div
                    data-testid="authResult"
                    style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}
                >
                    {JSON.stringify(authResult, null, 2)}
                </div>
            )}
            <iframe
                title="nestedApp"
                src={`${nestedAppProtocol}://localhost:${nestedAppPort}${
                    isEarEnabled() ? "?ear=true" : ""
                }`}
                style={{ width: "100%", height: "400px", border: "1px solid" }}
            />
        </div>
    );
}

export default App;
