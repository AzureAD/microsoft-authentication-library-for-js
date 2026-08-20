# Loopback Server

The loopback server is a core component of `msal-node`'s interactive authentication flow (`acquireTokenInteractive`). It enables desktop and CLI applications to receive authorization responses from the identity provider without requiring a publicly accessible redirect URI.

## How It Works

1. MSAL creates a temporary HTTP server bound to `127.0.0.1` (localhost) on an available port
2. The redirect URI (e.g., `http://localhost:52431`) is included in the authorization request
3. After the user authenticates, the identity provider redirects the browser to the loopback server
4. The server receives the authorization code and passes it back to MSAL for token exchange
5. The server shuts down after receiving the response

## Response Modes

The loopback server supports two response modes that control how the authorization code is delivered. `form_post` is the default as of v6; `query` remains available as an opt-in for backward compatibility.

### `form_post` (default)

The authorization code is delivered in a POST body:

```
POST / HTTP/1.1
Content-Type: application/x-www-form-urlencoded

code=AUTH_CODE&state=STATE
```

With `form_post`, the authorization code is kept out of the URL entirely — it never appears in the URL bar, is not stored in browser history, and cannot leak through the HTTP `Referer` header. As of v6 this is the default mode, so no `responseMode` is required:

```typescript
const result = await pca.acquireTokenInteractive({
    scopes: ["User.Read"],
    openBrowser: async (url) => { /* open url */ },
    // responseMode defaults to "form_post"
});
```

### `query` (opt-in)

The authorization code is delivered as a query parameter in a GET request:

```
GET /?code=AUTH_CODE&state=STATE HTTP/1.1
```

The server performs a 302 redirect to remove the authorization code from the browser's URL bar and history. As of v6 `query` is no longer the default; opt in explicitly if you need it:

```typescript
const result = await pca.acquireTokenInteractive({
    scopes: ["User.Read"],
    openBrowser: async (url) => { /* open url */ },
    responseMode: "query",
});
```

### Unsupported response modes

Only `query` and `form_post` are supported for the interactive loopback flow. Any other value (for example `fragment`) throws a `ClientConfigurationError` with the code `invalid_response_mode`. `fragment` cannot be used because URL fragments are never sent to the HTTP server, which would cause the flow to hang until it times out.

## Preferred Port

By default, the loopback server binds to a random available port. If your application requires a specific port (e.g., for a fixed redirect URI registered in your app registration), use the `preferredPort` option:

```typescript
const result = await pca.acquireTokenInteractive({
    scopes: ["User.Read"],
    openBrowser: async (url) => { /* open url */ },
    preferredPort: 3874,
});
```

If the preferred port is unavailable, the server falls back to a random port automatically.

> **Note:** When using a preferred port, register both `http://localhost:3874` and `http://localhost` as redirect URIs in your app registration to handle the fallback case.

## Custom Loopback Client (removed in v6)

> **⚠️ Removed:** The `loopbackClient` request option and the `ILoopbackClient` interface were removed in msal-node v6. Applications must use MSAL's built-in loopback server. If you previously provided a custom `loopbackClient` to select a fixed port, use the [`preferredPort`](#preferred-port) option instead. See the [v6 migration guide](./v6-migration.md) for details.

## Security Considerations

- The server binds to `127.0.0.1` only — it is not accessible from other machines
- No CORS headers are added — while a cross-origin page may still be able to send a request to the loopback address, it cannot read the response, so it cannot obtain the authorization code
- The server validates HTTP methods (only GET and POST are accepted)
- The server validates `Content-Type` on POST requests (only `application/x-www-form-urlencoded` is accepted)
- The server only resolves the authentication promise when a valid OAuth response (`code` or `error`) is received
- With `query` mode, a 302 redirect clears the authorization code from the browser URL
- With `form_post` mode, the code is never in the URL at all

## Related Resources

- [Initialize Public Client Application](./initialize-public-client-application.md)
- [Request Configuration](./request.md)
- [OAuth 2.0 Form Post Response Mode (OpenID Foundation)](https://openid.net/specs/oauth-v2-form-post-response-mode-1_0.html)
