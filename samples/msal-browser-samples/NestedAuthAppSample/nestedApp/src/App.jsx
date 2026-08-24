import React, { useState } from "react";
import { loginRequest } from "./authConfig";

/**
 * Nested (child) app UI. Every MSAL token API a nestable client supports is
 * exposed as its own button so the e2e harness can exercise each one through
 * the host's NAA bridge independently:
 *
 *   - `acquireTokenSilent` / `ssoSilent` -> bridge `GetToken`   (host brokers silently)
 *   - `acquireTokenPopup`  / `loginPopup` -> bridge `GetTokenPopup` (host brokers interactively)
 *
 * (`acquireTokenRedirect`, `loginRedirect` and `acquireTokenByCode` are not
 * supported by `NestedAppAuthController` — they throw — so they are not shown.)
 *
 * Each handler records which API produced the result (`data-testid="lastApi"`)
 * and renders the resulting account so the harness can assert per-API success
 * via the `homeAccountId` table header.
 */
function App({ pca }) {
    const [account, setAccount] = useState(pca.getActiveAccount());
    const [lastApi, setLastApi] = useState(null);
    const [error, setError] = useState(null);

    // Each token API is invoked in isolation (no silent->popup fallback) so a
    // test targeting one API exercises exactly that code path through the bridge.
    const run = (apiName, invoke) => async () => {
        setError(null);
        setAccount(null);
        setLastApi(null);
        try {
            const result = await invoke(loginRequest);
            pca.setActiveAccount(result.account);
            setAccount(result.account);
            setLastApi(apiName);
        } catch (e) {
            setError(`${apiName}: ${String(e)}`);
        }
    };

    const apis = [
        { name: "acquireTokenSilent", invoke: (r) => pca.acquireTokenSilent(r) },
        { name: "ssoSilent", invoke: (r) => pca.ssoSilent(r) },
        { name: "acquireTokenPopup", invoke: (r) => pca.acquireTokenPopup(r) },
        { name: "loginPopup", invoke: (r) => pca.loginPopup(r) },
    ];

    return (
        <div>
            <h2>NAA Nested App</h2>
            {apis.map((api) => (
                <button
                    key={api.name}
                    id={api.name}
                    onClick={run(api.name, api.invoke)}
                >
                    {api.name}
                </button>
            ))}
            {error && <pre style={{ color: "red" }}>{error}</pre>}
            {account && (
                <table data-testid="lastApi" data-api={lastApi ?? ""}>
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
