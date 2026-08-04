/*
 * Nested App Authentication (NAA) bridge — host (top-frame) side.
 *
 * The host app is the bridge *provider*: it implements the message handler that
 * the nested app's `window.nestedAppAuthBridge` shim relays requests to. When a
 * platform broker (e.g. the Microsoft SSO extension) is present the host would
 * forward these requests to the broker; this sample instead brokers them over
 * the regular web flow so the nested app never talks to the identity provider
 * directly and never receives a refresh token — the core NAA property.
 *
 * Web-flow brokering: the platform-broker `child_client_id` mechanism (minting a
 * token for a *different* client id) is only available through the broker, so in
 * web mode the host acquires the nested app's token with a second MSAL instance
 * configured for the nested client id. That instance leverages the host user's
 * existing ESTS session (ssoSilent, popup fallback); the resulting id + access
 * tokens are handed to the nested app, while the refresh token stays on the host
 * side — mirroring how the broker would keep it out of the embedded app.
 *
 * Wire protocol: see `lib/msal-browser/src/naa` (`BridgeRequestEnvelope`,
 * `BridgeResponseEnvelope`, `TokenResponse`, `AccountInfo`, `InitContext`).
 */

import {
    createStandardPublicClientApplication,
    LogLevel,
} from "@azure/msal-browser";

// Lazily-created MSAL instances keyed by the nested app's client id.
const brokerPcaCache = new Map();

function getBrokerPca(clientId, authority) {
    if (!brokerPcaCache.has(clientId)) {
        brokerPcaCache.set(
            clientId,
            createStandardPublicClientApplication({
                auth: {
                    clientId,
                    authority,
                },
                cache: {
                    cacheLocation: "localStorage",
                },
                system: {
                    loggerOptions: {
                        loggerCallback: (level, message, containsPii) => {
                            if (containsPii) {
                                return;
                            }
                            if (level === LogLevel.Error) {
                                console.error(`HostBroker: ${message}`);
                            }
                        },
                        logLevel: LogLevel.Error,
                    },
                },
            })
        );
    }
    return brokerPcaCache.get(clientId);
}

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
    const interactionRequired =
        error?.name === "InteractionRequiredAuthError" ||
        /interaction_required|login_required|consent_required/i.test(
            String(code)
        );
    return {
        status: interactionRequired
            ? "USER_INTERACTION_REQUIRED"
            : "PERSISTENT_ERROR",
        code: String(code),
        description,
    };
}

async function brokerToken(hostPca, tokenParams, interactive, defaultAuthority) {
    const authority = tokenParams.authority || defaultAuthority;
    const brokerPca = await getBrokerPca(tokenParams.clientId, authority);
    const scopes = (tokenParams.scope || "")
        .split(" ")
        .filter((scope) => scope.length > 0);
    const hostAccount = getHostAccount(hostPca);
    const loginHint = hostAccount?.username;

    const baseRequest = {
        scopes,
        authority,
        correlationId: tokenParams.correlationId,
    };

    if (interactive) {
        // GetTokenPopup — the nested app explicitly requested interaction.
        return brokerPca.acquireTokenPopup({ ...baseRequest, loginHint });
    }

    // GetToken — acquire silently only. If the broker already has the account
    // cached use it; otherwise leverage the host user's session via ssoSilent.
    // On failure we surface the error (mapped to USER_INTERACTION_REQUIRED) so
    // the nested app can decide to request interaction (GetTokenPopup) itself,
    // rather than the host opening an unexpected popup for a silent request.
    const existing = loginHint
        ? brokerPca
              .getAllAccounts()
              .find((account) => account.username === loginHint)
        : undefined;
    if (existing) {
        return brokerPca.acquireTokenSilent({
            ...baseRequest,
            account: existing,
        });
    }
    return brokerPca.ssoSilent({ ...baseRequest, loginHint });
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
