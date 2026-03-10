# MCP Flows

When `isMcp` is set to `true` in the MSAL configuration, MSAL enforces that all token requests include a `resource` parameter and caches access tokens keyed by that resource. This is used for MCP applications and is available for public client applications only.

## Enabling MCP

Set `isMcp: true` in the `auth` configuration when creating your `PublicClientApplication`:

```javascript
const config = {
    auth: {
        clientId: "your-client-id",
        authority: "https://login.microsoftonline.com/common",
        isMcp: true,
    },
};

const pca = new msal.PublicClientApplication(config);
```

## Resource Parameter

When `isMcp` is `true`, every token request **must** include a `resource` parameter. Omitting it will throw a `resource_parameter_required` error.

```javascript
const tokenRequest = {
    scopes: ["User.Read"],
    redirectUri: "http://localhost:3000/redirect",
    resource: "https://example.microsoft.com",
    code: authorizationCode,
};

const response = await pca.acquireTokenByCode(tokenRequest);
```

### Where to set `resource`

The `resource` parameter should be set directly on the request object. Do **not** pass it via `extraQueryParameters` at the same time as the `resource` property — doing so will throw a `misplaced_resource_parameter` error.

```javascript
// Correct
const request = {
    scopes: ["User.Read"],
    resource: "https://example.microsoft.com",
};

// Wrong — resource in both locations
const request = {
    scopes: ["User.Read"],
    resource: "https://example.microsoft.com",
    extraQueryParameters: { resource: "https://example.microsoft.com" },
};
```

## Resource-Scoped Caching

When `isMcp` is enabled, access tokens are cached with their associated resource. This affects silent token acquisition:

- **Cache hit**: If a cached access token exists for the same scopes **and** resource, it is returned from cache.
- **Cache miss**: If the requested resource does not match any cached token, MSAL falls back to the network to acquire a new token for the requested resource.

```javascript
const msalTokenCache = pca.getTokenCache();
const accounts = await msalTokenCache.getAllAccounts();

// First request — acquires token from network
const token1 = await pca.acquireTokenSilent({
    scopes: ["User.Read"],
    resource: "https://resource-a.microsoft.com",
    account: accounts[0],
});

// Same resource — returns cached token
const token2 = await pca.acquireTokenSilent({
    scopes: ["User.Read"],
    resource: "https://resource-a.microsoft.com",
    account: accounts[0],
});

// Different resource — falls back to network
const token3 = await pca.acquireTokenSilent({
    scopes: ["User.Read"],
    resource: "https://resource-b.microsoft.com",
    account: accounts[0],
});
```

## Error Handling

Two errors are specific to MCP flows:

| Error Code                     | Description                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `resource_parameter_required`  | `isMcp` is `true` but the request does not include a `resource` parameter.                                                |
| `misplaced_resource_parameter` | A `resource` was found both in the `resource` property and in `extraQueryParameters`. Use only one.                       |

Both errors are thrown as `ClientAuthError`. See the [errors documentation](../../../docs/errors.md) for more details.

## Samples

- [MCP Flows Sample](../../../samples/msal-node-samples/mcp-flows/README.md) — Express app demonstrating MCP with authorization code and silent flows
