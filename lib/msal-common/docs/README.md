# Shared MSAL protocol concepts

[All MSAL.js documentation](../../../docs/README.md) | [MSAL Common package overview](../README.md)

MSAL Common supplies protocol functionality used by MSAL Browser and MSAL Node. Applications should normally use a platform library, not call Common directly. These guides explain concepts shared across platforms.

## Authorities and accounts

- [Authority configuration](./authority.md).
- [Accounts](./Accounts.md) and [multi-tenant accounts](./multi-tenant-accounts.md).
- [AD FS](./ADFS.md).

## Claims and diagnostics

- [Claims challenges](./claims-challenge.md).
- [Client capabilities](./client-capability.md).
- [Performance](./performance.md).
- [Shared error catalog](../../../docs/errors.md).

For platform-specific setup and recovery, use [MSAL Browser](../../msal-browser/docs/README.md) or [MSAL Node](../../msal-node/docs/README.md).
