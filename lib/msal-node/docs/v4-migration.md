# Migrating from MSAL Node v3 to v4

## Configuration Changes

The `protocolMode` parameter is no longer an auth config option and is instead a system config option.

```ts
// BEFORE

const msalConfig = {
    auth: {
        clientId: "your_client_id",
        authority: "https://login.live.com",
        protocolMode: "OIDC",
    },
};

// AFTER

const msalConfig = {
    auth: {
        clientId: "your_client_id",
        authority: "https://login.live.com",
    },
    system: {
        protocolMode: "OIDC",
    },
};
```

The `skipAuthorityMetadataFlag` parameter has been removed and applications will not use the local metadata cache during authority initialization.

The `encodeExtraQueryParams` parameter has been removed and all extra query parameters are automatically encoded.

## `AccountEntity` is now a type

`AccountEntity` is now a type and the following functions can now be used via `AccountEntityUtils`: 
- `generateAccountId` (now takes in an AccountEntity object)
- `generateAccountKey` (now takes in an AccountEntity object)
- `getAccountInfo` (now takes in an AccountEntity object)
- `isSingleTenant` (now takes in an AccountEntity object)
- `generateAccountCacheKey` (no changes in input parameters)
- `createAccountEntity` (renamed from `createAccount`, no changes in input parameters)
- `createAccountEntityFromAccountInfo` (renamed from `createFromAccountInfo`, no changes in input parameters)
- `generateHomeAccountId` (no changes in input parameters)
- `isAccountEntity` (no changes in input parameters)
- `accountInfoIsEqual` (no changes in input parameters)

```ts
import { AccountEntity, AccountEntityUtils } from "@azure/msal-node";

const accountEntity: AccountEntity = {
    homeAccountId: "your-home-account-id",
    environment: "your-environment",
    realm: "your-realm",
    localAccountId: "your-local-account-id",
    username: "your-username",
    authorityType: "your-authority-type"
};

const accountId = AccountEntityUtils.generateAccountId(accountEntity);
const isAccountEntity = AccountEntityUtils.isAccountEntity(accountEntity);
```

## `fromNativeBroker` field is now called `fromPlatformBroker`

In the `AuthenticationResult` object, the `fromNativeBroker` field has been renamed to `fromPlatformBroker`