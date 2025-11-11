# Migrating from MSAL Node v4 to v5

## Dropped support for `proxyUrl` and `customAgentOptions`

MSAL Node v5 no longer provides optional configuration for the HttpClient.

## Configuration Changes

`proxyUrl` and `customAgentOptions` parameter are no longer configuration options.

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
