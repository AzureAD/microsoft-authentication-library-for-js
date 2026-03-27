---
applyTo: "**/lib/*/src/**"
description: "Use when modifying source code under lib/*/src/ for core MSAL libraries. Checks whether documentation needs to be updated to reflect code changes. Covers API behavior, configuration options, error messages, authentication flows, iframe/popup/redirect behavior, and migration guides."
---

# Documentation Review After Code Changes

When modifying source code under `lib/*/src/`, check whether documentation in the corresponding `lib/*/docs/` directory needs updates. Flag any documentation gaps and suggest specific updates.

## What to check

Each library has its own `docs/` directory. When reviewing changes, look for the corresponding docs in the **same library** that was modified (e.g., changes to `lib/msal-node/src/` should be checked against `lib/msal-node/docs/`).

### API surface changes

- New or renamed public methods, classes, interfaces, or properties → update relevant docs and add usage examples
- Changed method signatures (new parameters, changed defaults, removed options) → update docs showing the old signature
- Deprecated APIs → add deprecation notices with migration guidance

### Behavioral changes

- Changes to authentication flows (popup, redirect, silent, NAA) → update the corresponding library's flow documentation. For msal-browser, key docs include: `login-user.md`, `iframe-usage.md`, `redirect-bridge.md`. For msal-node, see `initialize-*.md` files.
- Changes to caching behavior → update the library's caching documentation (e.g., `caching.md` for msal-browser)
- Changes to error handling or new error codes → update error documentation in the affected library
- Changes to token acquisition or renewal logic → update the library's token lifecycle docs (e.g., `token-lifetimes.md` for msal-browser)

### Configuration changes

- New or changed configuration options → update the library's configuration documentation (e.g., `configuration.md` for msal-browser)
- Changed defaults → call out in migration docs

### Browser/platform constraints (msal-browser specific)

- Changes affected by browser security policies (COOP, COEP, storage partitioning, iframe sandboxing) → update `lib/msal-browser/docs/redirect-bridge.md`, `lib/msal-browser/docs/iframe-usage.md`
- Changes to cross-origin or cross-window communication → update relevant flow docs and known limitations

### Migration impact

- Breaking changes → update the latest migration guide in the affected library's docs (e.g., `v4-migration.md`)
- Behavioral changes that could surprise users → add notes to migration docs even if not strictly breaking

## How to flag

When you identify a documentation gap, suggest the specific file(s) to update and what content should change. Do not silently skip documentation review.
