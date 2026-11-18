/*
 * Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
 *
 * Wires up the four buttons to msal-browser APIs. Because enableLegacyPolling
 * is set in authConfig.js, calls to loginPopup / ssoSilent / logoutPopup all
 * use the legacy hash-polling flow instead of the redirect bridge.
 */
(async function () {
    const { PublicClientApplication } = window.msal;
    const pca = new PublicClientApplication(msalConfig);
    await pca.initialize();
    // Expose for E2E tests that need to drive MSAL APIs directly.
    window.pca = pca;

    const accountEl = document.getElementById("account");
    const outEl = document.getElementById("output");

    function refreshAccount() {
        const a = pca.getActiveAccount() || pca.getAllAccounts()[0];
        if (a) {
            pca.setActiveAccount(a);
            accountEl.textContent = a.username;
        } else {
            accountEl.textContent = "none";
        }
    }

    function show(label, value) {
        outEl.textContent =
            label +
            "\n" +
            (value instanceof Error
                ? value.stack || String(value)
                : JSON.stringify(value, null, 2));
    }

    refreshAccount();

    document.getElementById("btn-login").addEventListener("click", async () => {
        try {
            const r = await pca.loginPopup(loginRequest);
            refreshAccount();
            show("loginPopup result:", {
                account: r.account && r.account.username,
                scopes: r.scopes,
            });
        } catch (e) {
            show("loginPopup error:", e);
        }
    });

    document
        .getElementById("btn-sso-silent")
        .addEventListener("click", async () => {
            try {
                const r = await pca.ssoSilent({
                    ...loginRequest,
                    account: pca.getActiveAccount(),
                });
                refreshAccount();
                show("ssoSilent result:", {
                    account: r.account && r.account.username,
                    scopes: r.scopes,
                });
            } catch (e) {
                show("ssoSilent error:", e);
            }
        });

    document
        .getElementById("btn-logout")
        .addEventListener("click", async () => {
            try {
                await pca.logoutPopup({ account: pca.getActiveAccount() });
                refreshAccount();
                show("logoutPopup:", "completed");
            } catch (e) {
                show("logoutPopup error:", e);
            }
        });
})();
