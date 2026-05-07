# Browser Compatibility Map for MSAL Browser

This document catalogs browser Web APIs that MSAL Browser depends on, their role in authentication flows, MSAL's fallback behavior, and known MSAL-specific restrictions. For general browser support data, refer to [MDN Web Docs](https://developer.mozilla.org/).

> **Maintenance:** Update this file when a new browser API dependency is introduced or a browser change is discovered that affects MSAL flows.

## API Dependencies

### Storage

| API | MSAL Usage | Fallback |
|-----|-----------|----------|
| `sessionStorage` | Interaction status, PKCE verifier, redirect origin URL, redirect bridge response cache | `MemoryStorage` (response lost on navigation) |
| `localStorage` | Persistent token cache (when `cacheLocation: "localStorage"`) | None if configured; not used by default |
| `IndexedDB` | PoP token RSA keypairs | In-memory (keys lost on reload) |
| `document.cookie` | Encryption key for localStorage cache | None — cache cannot be decrypted without it |

**MSAL-specific restrictions:**
- Safari PB: `sessionStorage.setItem()` immediately before `location.replace()` may lose data — affects redirect bridge (`handleRedirectPromise` returns `null`)
- Safari ITP: 7-day cap on script-writable `localStorage`/cookies — tokens evicted without user interaction
- Firefox PB: `indexedDB.open()` throws `SecurityError` — PoP falls back to memory
- Chrome 115+ / Safari 16.1+: storage partitioned in cross-origin iframes — affects NAA and embedded apps

### Crypto

All `crypto.subtle` methods require HTTPS (secure context). On HTTP origins, `crypto.subtle` is `undefined`.

| API | MSAL Usage | Fallback |
|-----|-----------|----------|
| `crypto.subtle.digest()` | PKCE `code_challenge` (SHA-256) | None — PKCE is mandatory |
| `crypto.getRandomValues()` | PKCE verifier, state, nonce, correlation IDs | None |
| `crypto.subtle.generateKey()` | PoP RSA keypairs, EAR AES keys | None for PoP/EAR |
| `crypto.subtle.importKey()` | PoP signing, EAR decryption, localStorage encryption (HKDF → AES-GCM) | None |
| `crypto.subtle.sign()` | PoP token signing | None |
| `crypto.subtle.decrypt()` | EAR response decryption, localStorage decryption | None |
| `crypto.subtle.deriveKey()` | HKDF key derivation for localStorage encryption | None |

**MSAL-specific restriction:** `deriveKey()` with HKDF as base key requires Firefox 119+.

### Messaging

| API | MSAL Usage | Fallback |
|-----|-----------|----------|
| `BroadcastChannel` | Redirect bridge (popup/iframe → main frame), cross-tab cache sync | None for redirect bridge |
| `postMessage` + `MessageChannel` | WAM browser extension communication | None for WAM path |

**MSAL-specific restrictions:**
- Chrome 115+ / Firefox TCP: `BroadcastChannel` partitioned by top-level site — breaks cross-origin iframe ↔ popup communication
- Safari PB: cross-tab channels do not persist

### Navigation & Window

| API | MSAL Usage | Fallback |
|-----|-----------|----------|
| `window.location.assign()` / `.replace()` | Navigate to IdP | None |
| `window.location.hash` / `.search` | Extract auth response from redirect URL | None |
| `window.history.replaceState()` | Clean auth params from URL | Graceful no-op (URL stays dirty) |
| `pageshow` event | Detect bfcache restoration to clear stale interaction state | Graceful — may cause `interaction_in_progress` error |
| `window.open()` | Popup auth flows | None for popup |
| Hidden iframe | Silent token renewal (`ssoSilent`, `acquireTokenSilent` fallback) | None for silent renewal |
| `window.close()` | Close popup after auth | Graceful — popup stays open |

**MSAL-specific restrictions:**
- `window.open()` must be in a user-gesture call stack or browsers block it
- COOP `same-origin` on AAD severs `window.opener` in popups — redirect bridge mitigates
- Silent iframe requires IdP to allow framing and 3P cookies to be available; breaks under Safari ITP, Firefox TCP, and Chrome with 3P cookies disabled
- Office.js sets `history.replaceState` to `null` — MSAL guards with `typeof` check

### Network & DOM

| API | MSAL Usage | Fallback |
|-----|-----------|----------|
| `fetch()` | All HTTP requests (token endpoint, discovery, custom auth) | None |
| `TextEncoder` / `TextDecoder` | String ↔ binary for crypto | None |
| `atob()` / `btoa()` | Base64 for JWK and token parsing | None |
| Hidden form + `form.submit()` | POST-based `/authorize` (EAR, redirect POST, silent iframe POST) | None for POST flows |
| `<link rel="preconnect">` | Early DNS/TLS to authority domain | Graceful — just slower |

**MSAL-specific restrictions:**
- CSP `connect-src` must allow authority/token endpoint domains
- CSP `form-action` must allow authority domain for POST flows
- CSP `frame-src` must allow authority domain for silent iframe

## Privacy Restrictions Affecting MSAL

| Restriction | Affected Browsers | Impact on MSAL |
|-------------|-------------------|----------------|
| 3P cookie blocking | Safari (ITP), Firefox (TCP), Chrome (user setting/Incognito) | Silent iframe renewal fails |
| Storage partitioning in iframes | Chrome 115+, Safari 16.1+, Firefox TCP | `BroadcastChannel`/storage isolated — breaks embedded app scenarios |
| Script-writable storage 7-day cap | Safari ITP | `localStorage` tokens evicted; cookie-based encryption key lost |
| Private Browsing ephemeral storage | Safari, Firefox, Chrome | Tokens lost on tab close; IndexedDB blocked in Firefox PB |
| Tracker domain blocking (Safari 17+ PB) | Safari | CDN-hosted redirect bridge scripts may fail to load |

## Upcoming Changes

| Change | Status | MSAL Impact |
|--------|--------|-------------|
| Chrome Storage Access API | Shipping | Potential fallback for 3P-cookie-blocked iframe renewal |
| Safari tracking domain list expansion | Ongoing | More CDN domains may be blocked in PB |
| Firefox `BroadcastChannel` partitioned under TCP | Active (Firefox 102+) | Breaks cross-origin iframe ↔ popup channel |
| Platform authentication proposal | Early proposal | May enable native broker without extension |

## API-to-Flow Matrix

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

- ✅ = required | ○ = optional/configurable
- ¹ redirect bridge popup/iframe only (not direct redirect)
- ² when refresh token expired and MSAL falls back to hidden iframe
- ³ IdP session cookie required in iframe; MSAL's own cookie for localStorage encryption only
