---
applyTo: "**/lib/*/src/**"
description: "Use when modifying source code in any MSAL library. Checks whether documentation needs to be updated to reflect code changes. Covers API behavior, configuration options, error messages, authentication flows, iframe/popup/redirect behavior, and migration guides."
---

# Documentation Review After Code Changes

When modifying source code under `lib/*/src/`, check whether documentation in the corresponding `lib/*/docs/` directory needs updates. Flag any documentation gaps and suggest specific updates.

## What to check

### API surface changes

- New or renamed public methods, classes, interfaces, or properties → update relevant docs and add usage examples
- Changed method signatures (new parameters, changed defaults, removed options) → update docs showing the old signature
- Deprecated APIs → add deprecation notices with migration guidance

### Behavioral changes

- Changes to authentication flows (popup, redirect, silent, NAA) → update [login-user.md](../../lib/msal-browser/docs/login-user.md), [iframe-usage.md](../../lib/msal-browser/docs/iframe-usage.md), [redirect-bridge.md](../../lib/msal-browser/docs/redirect-bridge.md)
- Changes to caching behavior → update [caching.md](../../lib/msal-browser/docs/caching.md)
- Changes to error handling or new error codes → update error documentation
- Changes to token acquisition or renewal logic → update [token-lifetimes.md](../../lib/msal-browser/docs/token-lifetimes.md)

### Configuration changes

- New or changed configuration options → update [configuration.md](../../lib/msal-browser/docs/configuration.md)
- Changed defaults → call out in migration docs

### Browser/platform constraints

- Changes affected by browser security policies (COOP, COEP, storage partitioning, iframe sandboxing) → update [redirect-bridge.md](../../lib/msal-browser/docs/redirect-bridge.md), [iframe-usage.md](../../lib/msal-browser/docs/iframe-usage.md)
- Changes to cross-origin or cross-window communication → update relevant flow docs and known limitations

### Migration impact

- Breaking changes → update the latest migration guide (e.g., `v4-migration.md`)
- Behavioral changes that could surprise users → add notes to migration docs even if not strictly breaking

## How to flag

When you identify a documentation gap, suggest the specific file(s) to update and what content should change. Do not silently skip documentation review.
