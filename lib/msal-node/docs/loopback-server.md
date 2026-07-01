# Loopback Server

The loopback server is a core component of `msal-node`'s interactive authentication flow (`acquireTokenInteractive`). It enables desktop and CLI applications to receive authorization responses from the identity provider without requiring a publicly accessible redirect URI.

## How It Works

1. MSAL creates a temporary HTTP server bound to `127.0.0.1` (localhost) on an available port
2. The redirect URI (e.g., `http://localhost:52431`) is included in the authorization request
3. After the user authenticates, the identity provider redirects the browser to the loopback server
4. The server receives the authorization code and passes it back to MSAL for token exchange
5. The server shuts down after receiving the response

## Response Modes

The loopback server supports two response modes that control how the authorization code is delivered:

### `query` (default in v5)

The authorization code is delivered as a query parameter in a GET request:

```
GET /?code=AUTH_CODE&state=STATE HTTP/1.1
```

The server performs a 302 redirect to clear the authorization code from the browser's URL bar and history.

### `form_post`

The authorization code is delivered in a POST body:

```
POST / HTTP/1.1
Content-Type: application/x-www-form-urlencoded

code=AUTH_CODE&state=STATE
```

This mode is more secure because:
- The authorization code never appears in the URL bar
- The code is not stored in browser history
- The code cannot leak through the HTTP `Referer` header

To opt in to `form_post`:

```typescript
const result = await pca.acquireTokenInteractive({
    scopes: ["User.Read"],
    openBrowser: async (url) => { /* open url */ },
    responseMode: "form_post",
});
```

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

## Custom Loopback Client

> **⚠️ Deprecated:** The `loopbackClient` option is deprecated and will be removed in a future major version. Omit `loopbackClient` to use MSAL's built-in loopback server, and set `preferredPort` when you need a fixed port.

For advanced scenarios, you can provide a custom implementation of the `ILoopbackClient` interface:

```typescript
import { ILoopbackClient } from "@azure/msal-node";

const result = await pca.acquireTokenInteractive({
    scopes: ["User.Read"],
    openBrowser: async (url) => { /* open url */ },
    loopbackClient: myCustomLoopbackClient,
});
```

The `ILoopbackClient` interface requires three methods:
- `listenForAuthCode(successTemplate?, errorTemplate?)`: Start the server and return a promise that resolves with the authorization response
- `getRedirectUri()`: Return the redirect URI (e.g., `http://localhost:PORT`)
- `closeServer()`: Shut down the server

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
