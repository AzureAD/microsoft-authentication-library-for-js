---
description: "Use when reviewing or modifying msal-browser source code that introduces, changes, or removes browser Web API usage."
applyTo: "**/lib/msal-browser/src/**"
---

# Browser Compatibility Review

When a change to `lib/msal-browser/src/` introduces, modifies, or removes a browser Web API call, review the [Browser Compatibility Map](../../lib/msal-browser/docs/browser-compat-map.md) for MSAL-specific restrictions and flow dependencies.

## Review steps

1. **Cross-reference the compatibility map** — check which auth flows depend on the affected API, known restrictions, and whether a fallback exists.
2. **New API not in the map** — verify support on MDN/Can I Use (Chrome, Edge, Firefox, Safari desktop+iOS, Chrome Android). Check Private Browsing behavior and storage-partitioning impact. Request the map be updated.
3. **Validate fallback paths** — confirm `try/catch` or feature-detection guards exist for APIs with known restrictions. If no fallback exists on a critical path, flag for discussion.
4. **Check CSP/COOP/framing** — iframe changes need `frame-src`/sandbox review; popup changes need COOP consideration; `fetch()`/form-submit changes need `connect-src`/`form-action` review.
5. **Check beta channel risks** — see the "Upcoming Changes" section of the map for pending browser changes affecting the touched API.

## What to flag

- **Must fix**: API unavailable in a supported browser/mode with no fallback or `try/catch`
- **Discuss**: Critical-path API with known restrictions in beta channels
- **Informational**: Well-supported new API that should be added to the compatibility map
