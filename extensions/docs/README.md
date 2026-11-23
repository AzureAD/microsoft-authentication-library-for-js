# MSAL Node extensions documentation

[All MSAL.js documentation](../../docs/README.md) | [Package overview and installation](../msal-node-extensions/README.md)

MSAL Node extensions add operating-system integration to MSAL Node. Persistent cache storage and native token brokering are different capabilities; enabling one does not automatically enable the other.

## Persistent cache

- [Cache persistence and platform storage](./msal-node-extensions.md).
- [Extensions FAQ](./faq.md).
- [MSAL Node caching and cache plugins](../../lib/msal-node/docs/caching.md).

Use the operating system's protected storage and follow the guide's locking/concurrency requirements. Do not silently substitute an unprotected cache when protected storage is required.

## Native token broker

- [MSAL Node broker overview and Windows setup](../../lib/msal-node/docs/brokering.md).
- [Linux setup, dependencies, and limitations](../../lib/msal-node/docs/brokering.md#linux).
- [macOS Company Portal and SSO plug-in setup](../../lib/msal-node/docs/brokering.md#macos).

The broker manages its own cache and refresh-token protection. Serializing MSAL's token cache is not a way to export broker-managed refresh tokens. Consult the platform guide before choosing availability, fallback, or proof-of-possession behavior.
