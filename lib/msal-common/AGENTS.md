# msal-common Instructions

## Supported Environments

- msal-common is a cross-platform library that supports all modern mainstream browsers (Chrome, Firefox, Safari, Edge) and Node.js version 20+

Never use or suggest APIs or features that are not supported by the environments listed above.

## Request Thumbprint and Silent-Request Deduplication

`getRequestThumbprint` (`src/network/RequestThumbprint.ts`) produces the key used to deduplicate in-flight silent token requests (see `StandardController.acquireTokenSilentDeduped` in msal-browser). Two concurrent silent requests whose thumbprints serialize to the same key are collapsed into a single acquisition, and every caller receives that one result.

Because of this, any request parameter that influences the **identity or audience of the returned token** (for example `scopes`, `authority`, `claims`, `authenticationScheme`, `resource`) **must** be included in both the `RequestThumbprint` type and `getRequestThumbprint`. Omitting such a field lets two genuinely distinct concurrent requests collide on one key, so one caller receives a token minted for the other request (cross-resource / cross-audience token substitution and bearer-token disclosure).

When adding or changing any request parameter that affects the resulting token, confirm whether it belongs in the thumbprint and add coverage to `test/network/RequestThumbprint.spec.ts`.