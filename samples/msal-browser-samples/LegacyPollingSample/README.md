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

## Callback page

Legacy polling reads the response from the callback URL. Use a same-origin page
that does not run `broadcastResponseToMainFrame()`, `handleRedirectPromise()`, or
a router that consumes or changes the response. The default redirect bridge
scrubs the query/fragment and closes popup windows, so it cannot also serve as a
legacy-polling callback.

For a separate callback, a static page with a meaningful title is sufficient:

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>Completing authentication</title>
    </head>
    <body>
        Completing authentication...
    </body>
</html>
```

Register its exact URI and set both `auth.redirectUri` and
`auth.postLogoutRedirectUri` to it. This sample's root page is also usable: its
script installs button handlers but does not process or clear the response URL.

## Security model and compatible COOP policies

Legacy hash polling requires the opener to retain its popup reference throughout
the complete sign-in/sign-out round-trip. Strict
`Cross-Origin-Opener-Policy: same-origin` on the app severs that reference when
the popup reaches a cross-origin IdP. Once severed, returning to the app origin
does not restore it.

`same-origin-allow-popups` is different: an app using it can retain popups whose
cross-origin documents omit COOP or use `unsafe-none`. It is not limited to the
instant of popup creation. Do not remove a compatible app policy merely to use
polling; check the policies on the app, IdP, intermediate pages, and callback.
An enforcing COOP policy on a cross-origin response can still break the flow.

Only enable `enableLegacyPolling` where the threat model excludes arbitrary
cross-origin top-level openers. This option implies `auth.originCheck: false`;
MSAL logs a warning if that opt-out is used with a cross-origin opener.
`same-origin-allow-popups` does not make the opt-out a verified trusted
environment. Protection still includes PKCE, registered redirect URIs, and
single-use short-lived authorization codes. General web apps should use the
default redirect bridge, or the popup relay for cross-site embedded apps.

## Notes

-   This sample uses the locally-built `msal-browser` UMD bundle served by `server.js`. Re-run the build commands above after any source changes.

## Deterministic popup lifecycle tests

[test/popup-lifecycle.spec.ts](test/popup-lifecycle.spec.ts) adds browser regression
coverage for active sign-in replacement, all-account logout cancellation,
replacement-lock ownership, same-correlation-ID window isolation, pre-opened EAR
failure cleanup, and marker release before real main-window navigation. A
user-closed logout popup also verifies that ordinary closure remains best-effort
rather than becoming explicit cancellation.

The suite uses a loopback identity fixture and a passive same-origin callback.
It preserves real popup opening, polling, and storage behavior, without enforcing
COOP on the identity page. It uses controlled discovery failures and monitor
registration barriers instead of sleeps or retries. These tests do not fetch
lab credentials or depend on an Entra test slice, and they do not change the
sample UI's configuration. Setup-wide cancellation is not asserted.

The existing Jest server harness expects `.env.e2e` to exist; it may be empty for
this suite. Run:

```bash
npm run test:e2e -- --runInBand --testPathPattern=popup-lifecycle
```

The existing CI sample job runs the new suite automatically.
