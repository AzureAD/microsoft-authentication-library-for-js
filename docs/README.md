# MSAL.js documentation

Start with the library for your application. These indexes organize the guides maintained alongside the source; package READMEs contain installation instructions and supported-version information.

| Application or topic | Documentation | Installation and overview |
| --- | --- | --- |
| Browser single-page application | [MSAL Browser guides](../lib/msal-browser/docs/README.md) | [MSAL Browser](../lib/msal-browser/README.md) |
| Angular application | [MSAL Angular guides](../lib/msal-angular/docs/README.md) | [MSAL Angular](../lib/msal-angular/README.md) |
| React application | [MSAL React guides](../lib/msal-react/docs/README.md) | [MSAL React](../lib/msal-react/README.md) |
| Node.js server, desktop application, or CLI | [MSAL Node guides](../lib/msal-node/docs/README.md) | [MSAL Node](../lib/msal-node/README.md) |
| Node persistent cache and native broker integration | [Extensions guides](../extensions/docs/README.md) | [MSAL Node extensions](../extensions/msal-node-extensions/README.md) |
| Shared protocol and account concepts | [MSAL Common guides](../lib/msal-common/docs/README.md) | [MSAL Common](../lib/msal-common/README.md) |

MSAL Browser and MSAL Node build on MSAL Common. Angular and React wrap MSAL Browser; use their wrapper guidance together with the underlying browser concepts. Applications should normally use a platform library rather than call MSAL Common directly.

## Find a task

- **Register and initialize an application:** [Browser](../lib/msal-browser/docs/initialization.md), [Node registration](../lib/msal-node/docs/app-registration.md), [Angular](../lib/msal-angular/docs/initialization.md), or [React](../lib/msal-react/docs/getting-started.md).
- **Sign in and call an API:** [Browser login](../lib/msal-browser/docs/login-user.md), [Browser token acquisition](../lib/msal-browser/docs/acquire-token.md), or [Node request APIs](../lib/msal-node/docs/request.md).
- **Understand SSO and account selection:** [SSO scenarios](../lib/msal-browser/docs/single-sign-on.md), [Browser accounts](../lib/msal-browser/docs/accounts.md), or [Node accounts](../lib/msal-node/docs/accounts.md).
- **Troubleshoot authentication:** [Browser error handling](../lib/msal-browser/docs/handle-errors.md), [error catalog](./errors.md), [Angular errors](../lib/msal-angular/docs/errors.md), or [React errors](../lib/msal-react/docs/errors.md).
- **Handle a claims challenge:** [Shared claims-challenge guide](../lib/msal-common/docs/claims-challenge.md).
- **Use operating-system brokering:** [Node broker guide](../lib/msal-node/docs/brokering.md), including [Linux](../lib/msal-node/docs/brokering.md#linux) and [macOS](../lib/msal-node/docs/brokering.md#macos) setup.
- **Find External ID native-authentication APIs:** [Browser native-authentication navigation](../lib/msal-browser/docs/native-auth.md).
- **Migrate an older application:** Follow the migration index for [Browser](../lib/msal-browser/docs/README.md#migrations-and-historical-guidance), [Node](../lib/msal-node/docs/README.md#migrations), [Angular](../lib/msal-angular/docs/README.md#migrations), or [React](../lib/msal-react/docs/README.md#migrations).

## API reference and examples

Use the [generated API reference](https://azuread.github.io/microsoft-authentication-library-for-js/ref/) for signatures and the platform guides for end-to-end behavior. The [native-authentication export index](../lib/msal-browser/src/custom_auth/index.ts) provides source reference for the separate `custom-auth` entry point, including exports not present in the standard Browser reference.

Working applications are in [samples](../samples). Use the sample's own README for its prerequisites and registration steps. Guides on `dev` can describe unreleased changes; consult the matching release/tag when using an older npm package.
