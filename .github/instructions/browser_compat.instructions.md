---
description: "Use when reviewing or modifying msal-browser source code that touches browser Web APIs, storage, navigation, crypto, window/iframe management, BroadcastChannel, fetch, cookies, or DOM manipulation. Flags browser compatibility and privacy risks across Chrome, Edge, Firefox, Safari (including Private Browsing and mobile variants). Covers stable releases and beta channel changes."
applyTo: "**/lib/msal-browser/src/**"
---

# Browser Compatibility Review

When reviewing changes to `lib/msal-browser/src/`, check for browser compatibility and privacy restriction risks. This instruction applies to code that introduces, modifies, or removes usage of browser Web APIs.

## Review checklist

### 1. Identify affected browser APIs

For each changed file, determine which browser APIs are used. Cross-reference against the [Browser Compatibility Map](../../lib/msal-browser/docs/browser-compat-map.md) to understand:

- Which authentication flows depend on the API
- Known restrictions across browsers (especially Safari Private Browsing, Chrome storage partitioning, Firefox ETP)
- Whether a fallback exists

### 2. Check for new API introductions

If the change introduces a browser API **not already listed** in the compatibility map:

- Verify support on [MDN Web Docs](https://developer.mozilla.org/) and [Can I Use](https://caniuse.com/) for: Chrome, Edge, Firefox, Safari (desktop + iOS), Chrome Android
- Check if the API behaves differently in Private Browsing / Incognito mode
- Check if the API is affected by storage partitioning in cross-origin iframe contexts
- Flag if the API requires a secure context (HTTPS)
- **Request that the compatibility map be updated** with the new API entry

### 3. Evaluate privacy restriction impact

Flag changes that may break under these browser privacy features:

| Restriction | Browsers | What breaks |
|-------------|----------|-------------|
| Third-party cookie blocking | Safari (ITP), Firefox (ETP/TCP), Chrome (user-configured/manual blocking, Incognito) | Silent iframe renewal, IdP session detection |
| Storage partitioning in iframes | Chrome 115+, Safari 16.1+ | `BroadcastChannel`, `sessionStorage`, `localStorage`, `IndexedDB` isolated by top-level site |
| Script-writable storage 7-day cap | Safari (ITP 2.3+) | `localStorage` tokens expire without user interaction |
| Private Browsing ephemeral storage | Safari, Firefox, Chrome | All storage cleared on tab/window close; IndexedDB blocked in Firefox PB |
| Tracker domain blocking | Safari 17+ PB | Network requests to domains on tracker lists fail silently |
| `sessionStorage` write + navigation race | Safari PB | `sessionStorage.setItem()` immediately followed by `location.replace()` may lose data |

### 4. Validate fallback paths

When a change touches an API with known restrictions:

- Confirm there is a `try/catch` or feature-detection guard
- Verify the fallback behavior is documented (even if it's "auth fails gracefully")
- If no fallback exists and the API is in a critical path, flag for discussion

### 5. Check COOP / CSP / framing implications

- Changes to iframe creation or attributes → verify CSP `frame-src` and sandbox flags
- Changes to form submission targets → verify CSP `form-action` compatibility
- Changes to popup behavior → verify COOP `same-origin` handling (redirect bridge mitigates)
- Changes to `fetch()` targets → verify CORS and CSP `connect-src`

### 6. Cross-reference with beta channel changes

Check the "Upcoming / Beta Channel Changes to Track" section of the compatibility map. If the changed code touches an API that has pending browser changes (e.g., Chrome 3P cookie deprecation, Firefox `BroadcastChannel` partitioning), note the forward-looking risk.

## When to look up live documentation

Use live web lookups (MDN, Can I Use, WebKit blog, Chrome Platform Status) when:

- A new browser API is introduced that isn't in the compatibility map
- A reviewer or PR comment mentions a browser-specific issue not covered in the map
- The change targets a flow known to be fragile (silent iframe, redirect bridge, popup with COOP)

Do NOT look up every API on every review — use the compatibility map as the primary reference and only go to live sources for gaps.

## What to flag

- **Must fix before merge**: New API with no fallback that is unavailable in a supported browser or mode (e.g., using an API that throws in Firefox Private Browsing without a `try/catch`)
- **Should discuss**: Change to a critical-path API with known restrictions in beta channels (e.g., tightening `sessionStorage` usage in a flow that's fragile in Safari PB)
- **Informational**: New API that is well-supported but should be added to the compatibility map for future reference
