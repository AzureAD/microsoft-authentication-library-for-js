# Browser Compatibility Map for MSAL Browser

This document catalogs the browser APIs, security behaviors, and privacy restrictions that MSAL Browser depends on. It serves as a reference for PR reviewers and automated agents to flag compatibility risks when code changes touch these APIs or introduce new browser dependencies.

> **Maintenance:** Update this file whenever a new browser API dependency is introduced, a known restriction is discovered, or a browser vendor announces a behavioral change that affects MSAL.

## Critical Web API Dependencies

These APIs are required for core authentication flows. If any of these are unavailable or restricted, authentication will fail (unless a fallback is explicitly noted).

### Storage

Browsers commonly enforce a quota of about **5 MiB** for `sessionStorage` and about **5 MiB** for `localStorage` per origin (often about 10 MiB total for Web Storage per origin), but exact limits vary by browser, version, device, and storage pressure. Exceeding the quota throws `QuotaExceededError`. Accessing storage when the user has disabled it (or from an opaque origin like `file:` or `data:`) throws `SecurityError`. MDN notes: "if the user blocks cookies, browsers will probably interpret this as an instruction to prevent the page from persisting data."

| API | Used For | Fallback | Key Restrictions |
|-----|----------|----------|------------------|
| `sessionStorage` | Temporary auth state (interaction status, PKCE verifier, redirect origin URL, cached auth response in redirect bridge) | `MemoryStorage` (auth response lost on navigation) | Chrome 4+, Firefox 2+, Safari 4+, Safari iOS 3.2+. Safari PB: works but ephemeral per-tab; data does not survive `location.replace()` reliably (observed Safari 17+ PB). Safari 16.1+: partitioned in cross-origin iframes. MDN: "sessionStorage is partitioned by both origin and browser tabs (top-level browsing contexts)." |
| `localStorage` | Persistent token cache (when `cacheLocation: "localStorage"`) | Not used by default; no fallback if configured and unavailable | Chrome 4+, Firefox 3.5+, Safari 4+. Safari PB: available but ephemeral (cleared on tab close). Firefox PB: available but ephemeral. Some enterprise policies disable it entirely. Safari ITP: 7-day cap on script-writable data without user interaction (proactive eviction). WebKit blog: "Safari proactively evicts data when cross-site tracking prevention is turned on; origins without user interaction in 7 days have script-written data deleted." |
| `IndexedDB` | Stores asymmetric crypto keys for PoP token signing | In-memory fallback (keys lost on page reload) | Chrome 24+, Firefox 16+, Safari 10+, Safari iOS 10+. Safari PB: available since Safari 17 but ephemeral. Firefox PB: `indexedDB.open()` throws `SecurityError` — completely blocked. Cross-origin iframes in Safari: quota ~1/10 of parent frame's quota. |
| `document.cookie` | Stores encryption key for localStorage cache | None — encrypted localStorage cannot be decrypted without it | Safari ITP: 7-day expiry for script-set cookies (first-party); server-set cookies with `HttpOnly` are exempt. Safari PB: cookies are ephemeral. MSAL sets cookies with `SameSite=Lax` or `SameSite=None; Secure`. |

### Crypto

All `crypto.subtle` methods require a **secure context** (HTTPS or `localhost`). The secure-context requirement was enforced starting in Chrome 60, Edge 79, Firefox 75, Safari 15, Safari iOS 15, Chrome Android 60. On HTTP origins, `window.crypto.subtle` is `undefined` — no error is thrown, but any call will fail with a `TypeError`. In non-HTTPS WebViews, the entire `crypto.subtle` API may be absent depending on the host app's WebView configuration.

`crypto.getRandomValues()` does **not** require a secure context and is available on all origins including `file:` and `data:` (Chrome 11+, Firefox 21+, Safari 5+).

| API | Used For | Fallback | Key Restrictions |
|-----|----------|----------|------------------|
| `crypto.subtle.digest()` | PKCE `code_challenge` (SHA-256) | None — PKCE is mandatory | Chrome 41+, Edge 79+, Firefox 34+, Safari 7+, Safari iOS 7+. Android WebView 41+. Some older WebViews (pre-Chromium) lack SubtleCrypto entirely. |
| `crypto.getRandomValues()` | PKCE verifier, state, nonce, correlation IDs | None | Chrome 11+, Firefox 21+, Safari 5+, Safari iOS 5+. Does NOT require secure context. Available in all modern browsers including WebViews. |
| `crypto.subtle.generateKey()` | PoP token RSA keypairs (RSASSA-PKCS1-v1_5), EAR AES keys | None for PoP/EAR flows | Chrome 37+, Edge 79+, Firefox 34+, Safari 7+. MSAL uses `RSASSA-PKCS1-v1_5` — universally supported. |
| `crypto.subtle.importKey()` | PoP signing, EAR decryption, localStorage encryption (HKDF → AES-GCM) | None | Chrome 37+, Edge 79+, Firefox 34+, Safari 7+. JWK import supported in all. |
| `crypto.subtle.sign()` | PoP token signing (RSASSA-PKCS1-v1_5) | None | Chrome 37+, Edge 79+, Firefox 34+, Safari 7+. |
| `crypto.subtle.decrypt()` | EAR response decryption (AES-GCM), localStorage decryption | None for those flows | Chrome 37+, Edge 79+, Firefox 34+, Safari 7+. AES-GCM universally supported. |
| `crypto.subtle.deriveKey()` | HKDF key derivation for localStorage encryption | None | Chrome 41+, Edge 79+, Firefox 34+ (HKDF as base: Firefox 119+), Safari 11+. MSAL uses HKDF → AES-GCM which requires Firefox 119+ for full support. |

### Messaging

| API | Used For | Fallback | Key Restrictions |
|-----|----------|----------|------------------|
| `BroadcastChannel` | Redirect bridge (popup/iframe → main frame), cross-tab cache sync, cross-tab events | None for redirect bridge popup/iframe flows | Chrome 54+, Edge 79+, Firefox 38+, Safari 15.4+, Safari iOS 15.4+. Chrome 115+: partitioned by top-level site — "communication is allowed between browsing contexts using the same storage partition" (MDN); this breaks cross-origin iframe ↔ popup communication because the popup is its own top-level context. Safari PB: works within the same tab's storage partition but cross-tab channels do not persist. |
| `postMessage` + `MessageChannel` | WAM browser extension communication | None for WAM path | Universally supported (Chrome 2+, Firefox 3+, Safari 4+). MessageChannel: Chrome 4+, Firefox 41+, Safari 5+. No known private-browsing restrictions. |

### Navigation

| API | Used For | Fallback | Key Restrictions |
|-----|----------|----------|------------------|
| `window.location.assign()` / `.replace()` | Navigate to IdP and back to app | None | Universally supported. `.replace()` + `sessionStorage`: Safari PB may not persist `sessionStorage.setItem()` written immediately before `.replace()` — the synchronous write can be lost during page teardown (observed Safari 17+ PB). Chrome/Edge/Firefox persist the write reliably. |
| `window.location.hash` / `.search` | Extract auth response from URL after redirect | None | Universally supported. Hash routing SPAs: auth response in hash can conflict with app routes (e.g., `/#/route#code=...`). The redirect bridge avoids this by caching the response in `sessionStorage` instead. |
| `window.history.replaceState()` | Clean auth params from URL post-processing | Graceful no-op (auth still works, URL stays dirty) | Chrome 5+, Firefox 4+, Safari 6+. Office.js sets `window.history.replaceState` to `null` — MSAL guards with `typeof` check. |
| `pageshow` event | Detect bfcache restoration to clean stale state | Graceful — stale state may cause `interaction_in_progress` error | `event.persisted === true` indicates bfcache restoration. Safari is aggressive about bfcache (most navigations); Chrome is more selective. Firefox supports bfcache since Firefox 1. |

### Window / Frame

| API | Used For | Fallback | Key Restrictions |
|-----|----------|----------|------------------|
| `window.open()` | Popup auth flows | None for popup flows | Universally supported but subject to popup blockers. Must be called in the synchronous call stack of a user gesture (click/tap) or the browser will block it. Safari PB: stricter — may block even with user gesture if the tab has no prior interaction. Mobile browsers: typically opens as a new tab, not a popup window. iOS Safari: `window.open()` in WKWebView opens in a new Safari tab outside the app. |
| Hidden iframe (`createElement("iframe")`) | Silent token renewal (`ssoSilent`, `acquireTokenSilent` fallback) | None for silent renewal | MSAL creates iframes with `sandbox="allow-scripts allow-same-origin allow-forms"` and `allow="local-network-access *"`. Requires IdP to allow framing (`X-Frame-Options: ALLOW-FROM` or `Content-Security-Policy: frame-ancestors`). Third-party cookie restrictions break silent renewal in Safari (ITP) and Firefox (TCP). Chrome users who manually disable 3P cookies or use Incognito are also affected. App's CSP `frame-src` must allow the authority domain. |
| `window.close()` | Close popup after auth | Graceful — popup stays open | Browsers only allow `window.close()` on windows opened by script (`window.open()`), regardless of current origin. COOP `same-origin` headers on the target page sever the `window.opener` reference, preventing the opener from calling `.close()` — the redirect bridge mitigates this. |

### Network

| API | Used For | Fallback | Key Restrictions |
|-----|----------|----------|------------------|
| `fetch()` | All HTTP requests (token endpoint, discovery, custom auth) | None | Chrome 42+, Firefox 39+, Safari 10.1+, Safari iOS 10.3+. CORS requirements apply: token endpoints must return appropriate `Access-Control-Allow-Origin` headers. CSP `connect-src` must allow authority and token endpoint domains. Safari PB: blocks network loads to domains on the known-tracker list (DuckDuckGo ∩ EasyPrivacy); this affects third-party subresource loads, not first-party `fetch()` calls to auth endpoints like `login.microsoftonline.com`. |
| `TextEncoder` / `TextDecoder` | String ↔ binary conversion for crypto operations | None | Chrome 38+, Firefox 19+, Safari 10.1+, Safari iOS 10.3+. Missing in IE11 (unsupported by MSAL v5). |
| `atob()` / `btoa()` | Base64 for JWK and token parsing | None | Universally supported. `btoa()` throws on non-Latin1 characters — MSAL's implementation handles this. |

### DOM

| API | Used For | Fallback | Key Restrictions |
|-----|----------|----------|------------------|
| Hidden form + `form.submit()` | POST-based `/authorize` (EAR, redirect POST, silent iframe POST) | None for POST auth flows | Universally supported. CSP `form-action` must allow the authority domain (e.g., `form-action https://login.microsoftonline.com`). The form is created dynamically via `document.createElement("form")` with `method="POST"` and hidden `<input>` fields, then appended to `document.body` and submitted. |
| `<link rel="preconnect">` | Early DNS/TLS to authority domain | Graceful — just slower | Chrome 46+, Firefox 39+, Safari 11.1+. Created dynamically and removed after 10 seconds. No security implications. |

## Browser Privacy and Security Behaviors

These are not API availability issues but behavioral restrictions that affect MSAL's operation.

### Safari Intelligent Tracking Prevention (ITP)

| Behavior | Impact on MSAL | Since |
|----------|---------------|-------|
| Third-party cookies blocked | Silent iframe renewal fails (IdP session cookie inaccessible) | ITP 2.0 (Safari 12) |
| Script-writable storage 7-day cap | `localStorage` tokens expire after 7 days without user interaction on the domain | ITP 2.3 (Safari 13.1) |
| Storage partitioned in cross-origin iframes | `sessionStorage`/`localStorage` isolated per embedding site — affects NAA and iframe-based apps | Safari 16.1 |

### Safari Private Browsing

| Behavior | Impact on MSAL | Since |
|----------|---------------|-------|
| All storage is ephemeral (per-tab) | Tokens lost on tab close. No cross-tab sync. | Always |
| Network requests to known tracker domains blocked | CDN-hosted redirect bridge scripts may fail to load if CDN domain is on DuckDuckGo/EasyPrivacy intersection list | Safari 17 |
| `sessionStorage.setItem()` → `location.replace()` race | Auth response cached by redirect bridge may be lost before the target page reads it — `handleRedirectPromise` returns `null` | Observed in Safari 17+ PB |

### Chrome / Chromium (Edge, Opera, Brave)

| Behavior | Impact on MSAL | Since |
|----------|---------------|-------|
| Third-party cookie user settings | Silent iframe renewal breaks if the user disables third-party cookies in `chrome://settings`. Chrome originally tested blocking 3P cookies for 1% of users (Jan 2024) but reversed course — as of Apr 2025 Chrome maintains the status quo and will **not** deprecate 3P cookies by default. Incognito mode still blocks them. | User-configurable; no forced rollout planned |
| Storage partitioning (third-party contexts) | `BroadcastChannel`, `localStorage`, `sessionStorage`, `IndexedDB` partitioned by top-level site in iframes | Chrome 115 |
| COOP `same-origin` on AAD | `window.opener` severed in popups — redirect bridge mitigates this | Enabled by AAD |
| Popup blocker | `window.open()` blocked if not in user-gesture call stack | Always; stricter in incognito |

### Firefox

| Behavior | Impact on MSAL | Since |
|----------|---------------|-------|
| Enhanced Tracking Protection (ETP) | Third-party cookies and storage blocked for classified trackers | Firefox 69 |
| Total Cookie Protection | All third-party cookies partitioned by top-level site | Firefox 86 (strict mode); Firefox 102 (default for all users, June 2022) |
| Private Browsing: IndexedDB blocked | PoP key storage falls back to memory; keys lost on reload | Always in PB mode |

### Mobile Browsers

| Browser | Key Differences from Desktop |
|---------|------------------------------|
| Safari iOS | Same ITP/PB restrictions as macOS Safari. `window.open()` opens new tab, not popup. WKWebView: cross-origin iframes get ~1/10 of parent's storage quota (WebKit blog). WKWebView apps cannot be set as default browser — they get 15% disk quota vs 60% for browser apps (Safari, macOS 14+/iOS 17+). |
| Chrome Android | Popup opens as new tab. Custom Tabs (CCT) share cookies, saved passwords, and browsing data with the user's Chrome profile (unlike WebView). Storage partitioning same as desktop Chrome 115+. |
| Firefox Android | ETP same as desktop. IndexedDB PB restriction same as desktop (`SecurityError` on `open()`). |
| WebView (Android/iOS) | **Android WebView**: `crypto.subtle` available since WebView 37+ (Chromium-based). Pre-Chromium WebViews lack SubtleCrypto entirely. `window.open()` may be intercepted by the host app's `shouldOverrideUrlLoading`. Cookies/storage may not persist across WebView recreation. **iOS WKWebView**: `crypto.subtle` available since iOS 11+. `window.open()` opens in external Safari. Cookies are not shared with Safari unless the app uses `ASWebAuthenticationSession`. Storage quota depends on host app (15% disk for non-browser apps vs 60% for browser apps). |

## Upcoming / Beta Channel Changes to Track

| Browser | Change | Status | Potential Impact |
|---------|--------|--------|------------------|
| Chrome | Third-party cookie deprecation | **Cancelled** (Apr 2025) — Chrome will maintain the status quo; no forced rollout. Users can disable 3P cookies manually. Incognito blocks them by default. | Silent iframe renewal works unless user opts out |
| Chrome | Storage Access API | Shipping; continuing support | Potential fallback for environments where 3P cookies are manually blocked |
| Safari | Tracking domain list expansion | Ongoing | More CDN domains may be blocked in PB mode |
| Firefox | `BroadcastChannel` partitioned under TCP | Already active in TCP (Firefox 102+ default) | Breaks cross-origin iframe ↔ popup `BroadcastChannel` communication (same effect as Chrome 115 storage partitioning) |
| All | Platform authentication proposal | Early proposal | May provide native broker access without extension |

## API-to-Flow Matrix

Quick reference: which MSAL flows depend on which APIs.

| API | `loginRedirect` | `loginPopup` | `ssoSilent` | `acquireTokenSilent` | NAA | WAM |
|-----|:-:|:-:|:-:|:-:|:-:|:-:|
| `sessionStorage` | ✅ | | | | | |
| `localStorage` | ○ | ○ | ○ | ○ | | |
| `IndexedDB` | ○ | ○ | ○ | ○ | | |
| `BroadcastChannel` | ¹ | ✅ | ✅ | ✅² | | |
| `window.open()` | | ✅ | | | | |
| Hidden iframe | | | ✅ | ✅² | | |
| `crypto.subtle` | ✅ | ✅ | ✅ | ✅ | | |
| `fetch()` | ✅ | ✅ | ✅ | ✅ | | ✅ |
| `postMessage` | | | | | ✅ | ✅ |
| Form submit (POST) | ○ | ○ | ○ | | | |
| Cookies | ○ | ○ | ³ | ³ | | |

- ✅ = required
- ○ = optional / configurable
- ¹ = only when redirect bridge page communicates back to popup/iframe (not for direct redirect flow)
- ² = when refresh token is expired and MSAL falls back to hidden iframe
- ³ = IdP session cookie required in iframe; MSAL's own cookie used only for localStorage encryption
