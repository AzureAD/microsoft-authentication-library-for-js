/*
 * Nested App Authentication (NAA) bridge — host (top-frame) side.
 *
 * The host app is the bridge *provider*: it implements the message handler that
 * the nested app's `window.nestedAppAuthBridge` shim relays requests to. 

 * Wire protocol: see `lib/msal-browser/src/naa` (`BridgeRequestEnvelope`,
 * `BridgeResponseEnvelope`, `TokenResponse`, `AccountInfo`, `InitContext`).
 */

function getHostAccount(hostPca) {
    return hostPca.getActiveAccount() || hostPca.getAllAccounts()[0] || null;
}

function buildInitContext(hostPca) {
    const account = getHostAccount(hostPca);
    return {
        sdkName: "@azure/msal-browser",
        sdkVersion: "nestedAppAuthSample",
        capabilities: { queryAccount: false },
        accountContext: account
            ? {
                homeAccountId: account.homeAccountId,
                environment: account.environment,
                tenantId: account.tenantId,
            }
            : undefined,
    };
}

function toNaaAuthResult(result) {
    const expiresIn = result.expiresOn
        ? Math.max(0, Math.round((result.expiresOn.getTime() - Date.now()) / 1000))
        : 0;
    return {
        token: {
            access_token: result.accessToken,
            id_token: result.idToken,
            expires_in: expiresIn,
            scope: result.scopes.join(" "),
            authority: result.authority,
            properties: null,
        },
        account: {
            homeAccountId: result.account.homeAccountId,
            environment: result.account.environment,
            tenantId: result.account.tenantId,
            username: result.account.username,
            localAccountId: result.account.localAccountId,
            name: result.account.name,
            idToken: result.idToken,
            idTokenClaims: result.account.idTokenClaims,
        },
    };
}

function toBridgeError(error) {
    const code = error?.errorCode || error?.name || "unknown_error";
    const description = error?.errorMessage || error?.message || String(error);
    const subError = error?.subError || undefined;

    // Map MSAL errors onto the NAA BridgeStatusCode vocabulary a real host uses
    // (see lib/msal-browser/src/naa/BridgeStatusCode.ts). USER_INTERACTION_REQUIRED
    // tells the nested app it may retry via GetTokenPopup; the terminal codes do
    // not.
    let status;
    if (
        error?.name === "InteractionRequiredAuthError" ||
        /interaction_required|login_required|consent_required/i.test(String(code))
    ) {
        status = "USER_INTERACTION_REQUIRED";
    } else if (/user_cancel/i.test(String(code))) {
        status = "USER_CANCEL";
    } else if (/no_network_connectivity|network_error/i.test(String(code))) {
        status = "NO_NETWORK";
    } else if (/no_account_found|no_account_error/i.test(String(code))) {
        status = "ACCOUNT_UNAVAILABLE";
    } else {
        status = "PERSISTENT_ERROR";
    }

    return {
        status,
        code: String(code),
        subError,
        description,
    };
}

/**
 * Brokers a token for the nested (child) app through the host's own MSAL
 * instance.
 *
 * Passing the nested app's client id as `embeddedClientId` makes MSAL emit a
 * real brokered request: the host is the broker (`brk_client_id` /
 * `brk_redirect_uri` come from the host PCA config) and the nested app is the
 * embedded/child client (`client_id` / `child_redirect_uri`). This is the same
 * mechanism a genuine NAA host (e.g. Teams, Outlook) uses.
 *
 * Note: for ESTS to honor the brokered request the host and nested app
 * registrations must be linked (the child app pre-authorizing the broker, or an
 * equivalent trust relationship); otherwise the request is rejected.
 */
async function brokerToken(hostPca, tokenParams, interactive, defaultAuthority) {
    const authority = tokenParams.authority || defaultAuthority;
    const scopes = (tokenParams.scope || "")
        .split(" ")
        .filter((scope) => scope.length > 0);
    const hostAccount = getHostAccount(hostPca);
    const loginHint = hostAccount?.username;

    // Forward the NAA TokenRequest fields a real host honors (claims,
    // authentication scheme, and state), and broker on behalf of the nested app
    // via `embeddedClientId`.
    const baseRequest = {
        scopes,
        authority,
        correlationId: tokenParams.correlationId,
        claims: tokenParams.claims || undefined,
        state: tokenParams.state || undefined,
        authenticationScheme: tokenParams.authenticationScheme || undefined,
        embeddedClientId: tokenParams.clientId,
    };

    if (interactive) {
        // GetTokenPopup — the nested app explicitly requested interaction.
        return hostPca.acquireTokenPopup({
            ...baseRequest,
            account: hostAccount || undefined,
            loginHint: hostAccount ? undefined : loginHint,
        });
    }

    // GetToken — acquire silently on the host user's account. On failure we
    // surface the error (mapped to USER_INTERACTION_REQUIRED) so the nested app
    // can decide to request interaction (GetTokenPopup) itself, rather than the
    // host opening an unexpected popup for a silent request.
    if (hostAccount) {
        return hostPca.acquireTokenSilent({
            ...baseRequest,
            account: hostAccount,
        });
    }
    return hostPca.ssoSilent({ ...baseRequest, loginHint });
}

/**
 * Installs the host-side NAA bridge message handler.
 *
 * @param {import("@azure/msal-browser").IPublicClientApplication} hostPca The host MSAL instance (its signed-in user brokers the nested tokens).
 * @param {string} nestedOrigin The exact origin of the embedded nested app (messages from any other origin are ignored).
 */
export function installHostNestedAppAuthBridge(hostPca, nestedOrigin) {
    // Authority used to broker tokens when a nested-app request omits one; the
    // host and nested apps share the same tenant, so reuse the host's authority.
    const defaultAuthority = hostPca.getConfiguration().auth.authority;

    window.addEventListener("message", async (event) => {
        if (event.origin !== nestedOrigin) {
            return;
        }
        if (typeof event.data !== "string") {
            return;
        }
        let request;
        try {
            request = JSON.parse(event.data);
        } catch {
            return;
        }
        if (!request || request.messageType !== "NestedAppAuthRequest") {
            return;
        }

        const post = (partial) => {
            const envelope = {
                messageType: "NestedAppAuthResponse",
                requestId: request.requestId,
                success: !partial.error,
                ...partial,
            };
            event.source?.postMessage(JSON.stringify(envelope), event.origin);
        };

        try {
            switch (request.method) {
                case "GetInitContext":
                    post({ initContext: buildInitContext(hostPca) });
                    break;
                case "GetToken":
                case "GetTokenPopup": {
                    const result = await brokerToken(
                        hostPca,
                        request.tokenParams || {},
                        request.method === "GetTokenPopup",
                        defaultAuthority
                    );
                    post(toNaaAuthResult(result));
                    break;
                }
                default:
                    post({
                        error: {
                            status: "NESTED_APP_AUTH_UNAVAILABLE",
                            description: `Unsupported method: ${request.method}`,
                        },
                    });
            }
        } catch (error) {
            post({ error: toBridgeError(error) });
        }
    });
}
