# Accounts in MSAL Javascript

MSAL Javascript libraries (`msal-browser` and `msal-node`) support both single account and multiple accounts scenarios in javascript applications. An `account` object is standardized across the libraries:

```javascript
export type AccountInfo = {
    homeAccountId: string;
    environment: string;
    tenantId: string;
    username: string;
    localAccountId: string;
    name?: string;
};
```

## Account retrieval APIs

* Both `msal-browser` and `msal-node` provide their own implementations of the following public APIs:
    * `getAllAccounts()`: returns all the accounts currently in the cache. An application must choose an account to acquire tokens silently.
    * `getAccountByHomeId()`: receives a `homeAccountId` string and returns the matching account from the cache.
    * `getAccountByLocalId()`: receives a `localAccountId` string and returns the matching account from the cache.
* In addition, `msal-browser` provides a public API `getAccountByUsername()` for an application to retrieve a specific account based on `username`.

For detailed usage examples of these APIs, please visit the platform specific documentation on accounts:

* [Accounts on msal-browser](../../msal-browser/docs/accounts.md)
* [Accounts on msal-node](../../msal-node/docs/accounts.md)
