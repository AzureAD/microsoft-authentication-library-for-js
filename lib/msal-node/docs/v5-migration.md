# Migrating from MSAL Node v3 to v5

Note: There is no MSAL Node v4 release. The package version was incremented from v3 directly to v5 to align `msal-node` versioning with the other MSAL.js libraries. No separate v4 feature set exists.

## Dropped support for Node 16 and 18

MSAL Node v5 no longer supports Node.js 16 or 18; you must use Node.js 20 or greater.

## Dropped support for `proxyUrl` and `customAgentOptions`

MSAL Node v5 no longer provides optional configuration for the HttpClient.

## Configuration Changes

`proxyUrl` and `customAgentOptions` parameters are no longer configuration options.

```ts
// BEFORE

NodeSystemOptions = {
    loggerOptions?: LoggerOptions;
    networkClient?: INetworkModule;
    proxyUrl?: string;
    customAgentOptions?: http.AgentOptions | https.AgentOptions;
    disableInternalRetries?: boolean;
    protocolMode?: ProtocolMode;
};

// AFTER

NodeSystemOptions = {
    loggerOptions?: LoggerOptions;
    networkClient?: INetworkModule;
    disableInternalRetries?: boolean;
    protocolMode?: ProtocolMode;
};
```

Developers must now write their own custom HttpClient when proxy support is needed. We have an [existing sample](../../../samples/msal-node-samples/custom-INetworkModule-and-network-tracing/README.md) which showcases how to do this.

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
