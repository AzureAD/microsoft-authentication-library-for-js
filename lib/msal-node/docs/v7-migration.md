# MSAL Node v7 migration

MSAL Node v7 removes public client support from `@azure/msal-node`. The package now contains confidential client and Managed Identity functionality only.

## Removed APIs

The following public-client-only APIs are no longer available:

-   `PublicClientApplication` and `IPublicClientApplication`
-   device code and interactive token acquisition
-   public client sign-out
-   loopback server support
-   native broker configuration and integration

Applications importing these APIs must remove those imports and configuration before upgrading. This package does not provide a public client replacement.

`@azure/msal-node-extensions` also removes `NativeBrokerPlugin` in its corresponding major release. Its persistent cache, secure storage, and cross-platform locking APIs remain available.

## Retained APIs

`ConfidentialClientApplication` continues to support:

-   authorization code URL generation and code exchange
-   silent and refresh-token acquisition
-   client credentials
-   on-behalf-of acquisition
-   user federated identity credentials
-   the deprecated username/password flow
-   token cache and distributed cache APIs

`ManagedIdentityApplication` and all supported Managed Identity sources remain available. This release does not change cache keys, serialized cache values, or persistence behavior.

## `msal-common` package independence

`@azure/msal-node` no longer depends on or re-exports runtime objects from `@azure/msal-common`. Applications that import `@azure/msal-common` directly must declare it as their own dependency.

Use error classes and `Logger` exported by `@azure/msal-node` with MSAL Node APIs. Runtime constructor identity is package-specific, so an error thrown by MSAL Node is not an `instanceof` an error class imported from `@azure/msal-common`; compare stable error codes when handling errors across package boundaries. Similarly, pass the `Logger` exported by `@azure/msal-node` to `setLogger`.

Cache serialization remains compatible with previous MSAL Node versions and `@azure/msal-node-extensions`.
