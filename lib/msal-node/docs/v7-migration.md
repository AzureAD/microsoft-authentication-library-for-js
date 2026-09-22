# Migrating from MSAL Node v6 to v7

MSAL Node v7 removes interactive response-mode selection from
`PublicClientApplication.acquireTokenInteractive`. Browser-loopback authentication now always uses
`form_post`.

## Summary of breaking changes

| Change | Impact |
| --- | --- |
| `InteractiveRequest.responseMode` removed | Remove explicit `responseMode` values from interactive requests |
| Query callbacks rejected by the built-in loopback server | Identity providers must honor `response_mode=form_post` |

## Remove `responseMode` from interactive requests

MSAL Node v6 deprecated the `responseMode` option. In v7, remove it:

```ts
// BEFORE (v6)
const result = await pca.acquireTokenInteractive({
    scopes: ["User.Read"],
    openBrowser: async (url) => {
        /* open url */
    },
    responseMode: "query",
});

// AFTER (v7)
const result = await pca.acquireTokenInteractive({
    scopes: ["User.Read"],
    openBrowser: async (url) => {
        /* open url */
    },
});
```

Requests created for the browser-loopback path always contain `response_mode=form_post`.
JavaScript applications and applications compiled against an earlier MSAL Node version receive
`invalid_response_mode` if they supply `query`, `fragment`, or an unrecognized value to that path.
A legacy explicit `form_post` value remains accepted at runtime, but is no longer part of the
TypeScript request contract. Native-broker requests dispatch before this browser-only validation
and continue forwarding legacy response-mode values to the broker.

## Loopback GET callbacks

The built-in interactive loopback server no longer accepts OAuth responses through GET query
parameters. A GET request containing `code` or `error` returns HTTP 400 and fails the pending
interaction with `loopback_server_query_response_not_supported`.

Valid `application/x-www-form-urlencoded` POST success and error responses continue working.
Harmless GET requests without OAuth response parameters do not complete or fail authentication.

## Unchanged APIs and flows

This change applies only to the browser-loopback path used by `acquireTokenInteractive`:

- Native-broker requests continue to dispatch before browser response-mode validation.
- `getAuthCodeUrl` remains unchanged.
- Confidential-client and manually hosted authorization-code flows remain unchanged.
- Global `ResponseMode` constants remain available for APIs that still support them.

## Related resources

- [Loopback Server](./loopback-server.md)
- [Request Configuration](./request.md)
- [MSAL Node v6 migration guide](./v6-migration.md)
