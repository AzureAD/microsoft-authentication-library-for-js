# Browser-Specific Guidance for MSAL Browser Applications

This guide highlights browser-specific behaviors that can affect auth flows in `@azure/msal-browser` and gives practical recommendations for building reliable apps across major browsers.

## Safari

### Third-party cookie blocking (ITP) and `ssoSilent`

Safari's Intelligent Tracking Prevention (ITP) blocks third-party cookies by default, including in Private Browsing. Because `ssoSilent()` runs in a hidden iframe and depends on the IdP session cookie being available in that context, `ssoSilent` is not a reliable default SSO path in Safari.

**Recommendation:** Do not use `ssoSilent` as your default sign-in check in Safari. Prefer `acquireTokenSilent()` for cached tokens/refresh tokens, and fall back to an interactive API when needed.

### Popup blockers and async popup calls

Safari enforces strict popup rules. If `window.open()` is not triggered directly in a synchronous user gesture call stack, popup flows may be blocked. Async operations (for example awaiting a network call) between a user click and calling `loginPopup()` or `acquireTokenPopup()` can trigger this behavior.

**Recommendation:** Prefer `loginRedirect()` and `acquireTokenRedirect()` on Safari for highest reliability.

### 7-day cap on script-writable storage

Safari ITP can cap script-writable storage (`localStorage` and script-writable cookies) at 7 days without direct user navigation to your site. This can evict cached auth artifacts and force reauthentication.

**Recommendation:** Handle token/cache eviction gracefully in Safari. For many apps, `sessionStorage` plus redirect fallback is the most predictable approach.

### Private Browsing storage behavior

Safari Private Browsing uses ephemeral storage. Tokens and other artifacts are lost on tab close. In addition, `sessionStorage.setItem()` immediately before `location.replace()` may be dropped in Safari Private Browsing.

**Recommendation:** Treat Private Browsing sessions as short-lived and ensure your app can recover with interactive auth.

### Tracker domain blocking in Safari 17+ Private Browsing

Safari 17+ Private Browsing can block requests to known tracker domains. CDN-hosted assets may be impacted depending on domain reputation.

**Recommendation:** Bundle or self-host MSAL assets in production deployments instead of relying on CDN delivery.

### Safari summary recommendation

Use redirect flows (`loginRedirect`, `acquireTokenRedirect`) as the primary interactive path. Treat popup and `ssoSilent` as optional enhancements with robust fallback handling.

## Firefox

### Tracking protection and third-party cookies

Firefox Tracking Protection can block third-party cookies, especially in Strict mode and Private Browsing. This can break hidden-iframe SSO and renewal paths.

**Impact:** `ssoSilent` and iframe-based silent renewal can fail.

### Private Browsing and IndexedDB

In Firefox Private Browsing, `indexedDB.open()` may throw `SecurityError`.

**Impact:** PoP key storage falls back to in-memory storage and keys are lost on reload/tab close.

### Storage partitioning effects

Under Firefox Total Cookie Protection (TCP), `BroadcastChannel` and related storage are partitioned by top-level site for cross-origin embed scenarios.

**Impact:** Cross-origin iframe ↔ popup redirect bridge communication can fail.

## Chrome and Edge (Chromium)

### Incognito and third-party cookies

When third-party cookies are blocked (for example in Incognito or user-configured settings), iframe-based SSO/renewal paths are affected.

**Impact:** `ssoSilent` and hidden iframe renewals can fail.

### Cross-origin iframe storage partitioning (Chrome 115+)

Storage APIs including `BroadcastChannel`, `localStorage`, and `IndexedDB` are partitioned by top-level site in cross-origin iframe scenarios.

**Impact:** Popup flows launched from cross-origin iframes can time out because redirect bridge responses do not reach the embedded app.

### Chrome/Edge summary

Chrome/Edge are generally the most compatible browsers for both popup and redirect in top-level app contexts, but embedded/cross-origin scenarios still require special handling.

## Mobile browsers

Popup APIs are less reliable on mobile due to popup restrictions and variable webview behavior.

**Recommendation:** Use redirect APIs (`loginRedirect`, `acquireTokenRedirect`) as the default mobile interaction strategy.

## Intune Company Portal and device management scenarios

On managed devices, Microsoft Authenticator and Intune Company Portal can participate in authentication and compliance evaluation. This may introduce additional prompts and policy-driven behavior (for example, conditional access and compliance checks).

### Testing recommendations

Validate your auth flows in each of the following environments:

1. Unmanaged device/browser (no Company Portal, no MDM enrollment)
2. Intune-enrolled device with Company Portal installed
3. Device compliance/conditional access scenarios that require managed or compliant devices

For web apps, keep in mind that browser-specific restrictions (Safari iOS, Chrome Android, private/incognito behavior) still apply even when native broker apps are present.

## Recommended patterns

| Scenario | Recommended API | Avoid |
|---|---|---|
| Initial login (all browsers) | `loginRedirect` | `loginPopup` on Safari/mobile |
| SSO check | `acquireTokenSilent` (uses cached refresh token when available) | `ssoSilent` as default on Safari/Firefox |
| Token refresh fallback | `acquireTokenSilent` → `acquireTokenRedirect` | Relying on hidden iframe renewal where 3P cookies are blocked |
| Embedded cross-origin iframe apps | `createNestablePublicClientApplication` (NAA) when available | Popup/silent flows that depend on cross-partition storage communication |
