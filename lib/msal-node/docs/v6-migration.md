# Migrating from MSAL Node v5 to v6

MSAL Node v6 is a breaking release focused on the interactive authentication flow (`acquireTokenInteractive`). It makes `form_post` the default response mode and removes the previously deprecated custom loopback client API.

## Summary of breaking changes

| Change | Impact |
| --- | --- |
| `acquireTokenInteractive` uses only `form_post` | Remove any explicit `responseMode: "query"` setting; the built-in loopback server handles the POST callback |
| `loopbackClient` request option removed | Custom loopback server implementations are no longer supported; use the built-in loopback server |
| `ILoopbackClient` interface removed | The exported `ILoopbackClient` type is no longer available |

## `form_post` is now the default response mode

In v5, `acquireTokenInteractive` defaulted to `query`, delivering the authorization code as a URL query parameter (`GET /?code=...`). In v6, the default is `form_post`, delivering the code in a URL-encoded POST body (`POST /` with `code=...`).

The built-in loopback server handles the `form_post` callback, so applications that did not explicitly request `query` require no code changes. `form_post` keeps the authorization code out of the URL by returning it in the POST body.

```ts
// BEFORE (v5): responseMode defaulted to "query"
const result = await pca.acquireTokenInteractive({
    scopes: ["User.Read"],
    openBrowser: async (url) => {
        /* open url */
    },
});

// AFTER (v6): responseMode defaults to "form_post" — no change required
const result = await pca.acquireTokenInteractive({
    scopes: ["User.Read"],
    openBrowser: async (url) => {
        /* open url */
    },
});
```

### Remove explicit `query` configuration

Later v6 releases enforce the original security decision that interactive authentication must use
`form_post`. Remove `responseMode: "query"` from interactive requests:

```ts
// BEFORE: no longer supported
const result = await pca.acquireTokenInteractive({
    scopes: ["User.Read"],
    openBrowser: async (url) => {
        /* open url */
    },
    responseMode: "query",
});

// AFTER
const result = await pca.acquireTokenInteractive({
    scopes: ["User.Read"],
    openBrowser: async (url) => {
        /* open url */
    },
});
```

Callers may explicitly pass `responseMode: "form_post"` for source compatibility, but it is
unnecessary. Supplying `query`, `fragment`, or any other runtime value throws a
`ClientConfigurationError` with the code `invalid_response_mode`. Manual authorization URL APIs,
including confidential-client flows, are unchanged.

## `loopbackClient` option and `ILoopbackClient` interface removed

The `loopbackClient` request option and the `ILoopbackClient` interface — both deprecated in v5 — have been removed. Applications must use MSAL's built-in loopback server.

If you provided a custom `loopbackClient` only to bind a fixed port, use the `preferredPort` option instead:

```ts
// BEFORE (v5): custom loopback client to control the port
import { ILoopbackClient } from "@azure/msal-node";

const customLoopbackClient: ILoopbackClient = {
    /* listenForAuthCode / getRedirectUri / closeServer */
};

const result = await pca.acquireTokenInteractive({
    scopes: ["User.Read"],
    openBrowser: async (url) => {
        /* open url */
    },
    loopbackClient: customLoopbackClient,
});

// AFTER (v6): use the built-in server with preferredPort
const result = await pca.acquireTokenInteractive({
    scopes: ["User.Read"],
    openBrowser: async (url) => {
        /* open url */
    },
    preferredPort: 3874,
});
```

When using `preferredPort`, register both `http://localhost:3874` and `http://localhost` as redirect URIs in your app registration to handle the fallback case (the built-in server falls back to a random port if the preferred port is unavailable).

Remove any `import { ILoopbackClient } from "@azure/msal-node";` statements — the type no longer exists.

## Related resources

- [Loopback Server](./loopback-server.md)
- [Request Configuration](./request.md)
- [OAuth 2.0 Form Post Response Mode (OpenID Foundation)](https://openid.net/specs/oauth-v2-form-post-response-mode-1_0.html)
