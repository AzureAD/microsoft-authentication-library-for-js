# MSAL Browser documentation

[All MSAL.js documentation](../../../docs/README.md) | [Package overview and installation](../README.md) | [FAQ](../FAQ.md)

MSAL Browser authenticates single-page applications using authorization code flow with PKCE. For Angular and React applications, start with the corresponding [Angular](../../msal-angular/docs/README.md) or [React](../../msal-react/docs/README.md) wrapper guide as well.

## Get started

- [Initialize the application](./initialization.md) and [configure MSAL](./configuration.md).
- [Set up the redirect bridge](./redirect-bridge.md) for authentication responses.
- [Sign in a user](./login-user.md), [select an account](./accounts.md), and [acquire access tokens](./acquire-token.md).
- [Understand resources and scopes](./resources-and-scopes.md), [token lifetimes](./token-lifetimes.md), and [cache storage](./caching.md).
- [Sign out](./logout.md).

## Sign-in experience and application integration

- [Single sign-on scenarios](./single-sign-on.md) and [prompt behavior](./prompt-behavior.md).
- [Preserve application state](./custom-state.md) and understand [request/response objects](./request-response-object.md) and [authentication results](./response.md).
- [Subscribe to events](./events.md), [customize navigation](./navigation.md), and [measure performance](./performance.md).
- [Use MSAL in iframes](./iframe-usage.md), review [browser-specific restrictions](./browser-specific-guidance.md), and consult the [browser compatibility map](./browser-compat-map.md).
- [Work with B2C](./working-with-b2c.md) or find the separate [External ID native-authentication APIs](./native-auth.md).

## Advanced token scenarios

- [Device-bound tokens](./device-bound-tokens.md).
- [Access-token proof of possession](./access-token-proof-of-possession.md) and [signed HTTP requests](./signed-http-request.md).
- [Signed-request client claims](./shr-client-claims.md) and [server nonces](./shr-server-nonce.md).
- [SSH certificates](./ssh-certificates.md), [attribute tokens](./attribute-tokens.md), and [MCP authorization](./mcp.md).
- Shared [claims challenges](../../msal-common/docs/claims-challenge.md) and [client capabilities](../../msal-common/docs/client-capability.md).

Feature availability varies by release and environment. Observe experimental/preview warnings in individual guides; inclusion in this index does not change a feature's support status.

## Troubleshooting and testing

- [Handle errors and interaction-required responses](./handle-errors.md).
- [Enable logging](./logging.md) and use the [error catalog](../../../docs/errors.md).
- [Test applications using MSAL](./testing.md) and review the [FAQ](../FAQ.md).

## Migrations and historical guidance

Apply the guides relevant to each version boundary; older examples do not override the current initialization or redirect-bridge requirements.

- [MSAL 1.x to 2.x](./v1-migration.md).
- [MSAL Browser 2.x to 3.x](./v2-migration.md).
- [MSAL Browser 3.x to 4.x](./v3-migration.md).
- [MSAL Browser 4.x to 5.x](./v4-migration.md).
- [CDN and self-hosting guidance](./cdn-usage.md).
