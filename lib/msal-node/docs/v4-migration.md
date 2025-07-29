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

## `fromNativeBroker` field is now called `fromPlatformBroker`

In the `AuthenticationResult` object, the `fromNativeBroker` field has been renamed to `fromPlatformBroker`.