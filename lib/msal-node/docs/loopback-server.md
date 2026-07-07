# Loopback Server

The loopback server is a core component of `msal-node`'s interactive authentication flow (`acquireTokenInteractive`). It enables desktop and CLI applications to receive authorization responses from the identity provider without requiring a publicly accessible redirect URI.

## How It Works

1. MSAL creates a temporary HTTP server bound to `127.0.0.1` (localhost) on an available port
2. The redirect URI (e.g., `http://localhost:52431`) is included in the authorization request
3. After the user authenticates, the identity provider redirects the browser to the loopback server
4. The server receives the authorization code and passes it back to MSAL for token exchange
5. The server shuts down after receiving the response

## Response Modes

The loopback server supports two response modes that control how the authorization code is delivered. `form_post` is the preferred mode and will become the default in a future major version; `query` remains the default in v5 for backward compatibility.

### `form_post` (preferred)

The authorization code is delivered in a POST body:

```
POST / HTTP/1.1
Content-Type: application/x-www-form-urlencoded

code=AUTH_CODE&state=STATE
```

With `form_post`, the authorization code is kept out of the URL entirely — it never appears in the URL bar, is not stored in browser history, and cannot leak through the HTTP `Referer` header. This is the recommended mode for new applications and will be mandated in a future major version.

To opt in to `form_post`:

```typescript
const result = await pca.acquireTokenInteractive({
    scopes: ["User.Read"],
    openBrowser: async (url) => { /* open url */ },
    responseMode: "form_post",
});
```

### `query` (default in v5)

The authorization code is delivered as a query parameter in a GET request:

```
GET /?code=AUTH_CODE&state=STATE HTTP/1.1
```

The server performs a 302 redirect to remove the authorization code from the browser's URL bar and history. This remains the default in v5 for backward compatibility, but `form_post` is preferred going forward.

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
