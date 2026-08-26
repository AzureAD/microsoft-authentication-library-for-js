import React, { useState } from "react";
import { loginRequest } from "./authConfig";

/**
 * Nested (child) app UI. Each MSAL token API a nestable client supports is
 * exposed as its own button so the e2e harness can exercise each one through
 * the host's NAA bridge, and the result is tagged with the API that produced it.
 */
function App({ pca }) {
    const [account, setAccount] = useState(pca.getActiveAccount());
    const [lastApi, setLastApi] = useState(null);
    const [error, setError] = useState(null);

    // Each API is invoked in isolation (no silent->popup fallback).
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
            setError({
                api: apiName,
                code: e?.errorCode ?? "",
                text: String(e),
            });
        }
    };

    const apis = [
        { name: "acquireTokenSilent", invoke: (r) => pca.acquireTokenSilent(r) },
        { name: "ssoSilent", invoke: (r) => pca.ssoSilent(r) },
        { name: "acquireTokenPopup", invoke: (r) => pca.acquireTokenPopup(r) },
        { name: "loginPopup", invoke: (r) => pca.loginPopup(r) },
        // Redirect is unsupported for nested apps; kept so the harness can assert
        // it throws the expected error.
        {
            name: "acquireTokenRedirect",
            invoke: (r) => pca.acquireTokenRedirect(r),
        },
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
            {error && (
                <pre
                    data-testid="apiError"
                    data-api={error.api}
                    data-error-code={error.code}
                    style={{ color: "red" }}
                >
                    {error.text}
                </pre>
            )}
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
