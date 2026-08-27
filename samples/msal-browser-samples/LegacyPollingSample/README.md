# Legacy Polling Sample

Demonstrates the `system.enableLegacyPolling` opt-in for `@azure/msal-browser`. When enabled, popup, `logoutPopup`, and `ssoSilent` flows poll the popup/iframe URL for the auth response (v4 behavior) instead of relying on the COOP-safe redirect-bridge.

Use this opt-in for hosts that cannot adopt COOP yet — for example Office Add-ins or legacy in-app browser surfaces.

See [Cross-Origin-Opener-Policy and popup responses](../../../lib/msal-browser/docs/configuration.md#cross-origin-opener-policy-and-popup-responses) for how this option relates to the redirect bridge, `auth.popupRelayUri`, and the `pocd` parameter.

## Setup

1. From the repo root, build the libraries the sample depends on:

    ```sh
    npm install
    npm run build:all --workspace=lib/msal-browser
    ```

2. Edit `app/authConfig.js` and replace `clientId` with your own AAD app registration's client ID. Set the redirect URI on the app registration to `http://localhost:30664/`.

## Run

```sh
cd samples/msal-browser-samples/LegacyPollingSample
npm start
```

Open <http://localhost:30664/> and click the buttons:

-   **Login (Legacy Popup)** → calls `loginPopup` through the injected legacy popup hook
-   **ssoSilent** → calls `ssoSilent` through the injected legacy iframe hook
-   **Logout (Legacy Popup)** → calls `logoutPopup` through the injected legacy popup hook

## What this sample is verifying

-   The opt-in switch (`system.enableLegacyPolling: true`) successfully routes popup and iframe interactions through the legacy v4-style polling clients on a non-COOP host.

## ⚠️ Security model: `enableLegacyPolling` is incompatible with COOP

Legacy hash polling works by having the opener read `popupWindow.location.href` after the popup returns from ESTS. That cross-document read is exactly what `Cross-Origin-Opener-Policy` is designed to prevent. As soon as the popup navigates cross-origin to ESTS, any non-default COOP on the opener triggers a browsing-context-group swap — the opener's `WindowProxy` is irreversibly severed (`popupWindow.closed` becomes `true`), and the swap does **not** reverse when the popup returns to the app origin. **Therefore an application that opts into `system.enableLegacyPolling: true` cannot enforce COOP on its own origin.** This is the trade-off the flag exists to make: it's the workaround for hosts where COOP cannot be applied (Office Add-ins, legacy WebViews, third-party-framed scenarios). Hosts that _can_ set COOP must use the default (redirect-bridge) flow instead.

Only enable `enableLegacyPolling` in hosting environments where the threat model excludes arbitrary cross-origin top-level openers. For general web apps, use the default redirect-bridge flow with COOP enforced — that path is the one designed to be safe under COOP.

Because COOP can't be used to isolate this flow, protection against auth-code theft rests on PKCE, the `redirect_uri` allow-list on the app registration, and single-use short-lived auth codes. `enableLegacyPolling` implies `auth.originCheck: false`, and MSAL logs a warning when the origin check is disabled while the top-level window actually has a cross-origin opener.

### Why not `Cross-Origin-Opener-Policy: same-origin-allow-popups`?

It looks like the right knob but it isn't. `same-origin-allow-popups` only affects _popup creation_ — it prevents the popup from being placed in its own browsing-context group at open time. It does not relax COOP matching on subsequent navigations, so the moment the popup navigates to ESTS the BCG swap still happens and polling breaks. There is no COOP value that simultaneously protects against malicious openers _and_ preserves the popup connection across the ESTS round-trip.

## Notes

-   This sample uses the locally-built `msal-browser` UMD bundle served by `server.js`. Re-run the build commands above after any source changes.
