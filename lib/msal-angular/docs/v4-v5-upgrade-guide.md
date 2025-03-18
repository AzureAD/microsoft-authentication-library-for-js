# Upgrading from MSAL Angular v4 to v5

MSAL Angular v5 requires Angular 19 or above.

## Changes in `@azure/msal-angular@5`

### Handling redirects

Applications that upgrade to MSAL Angular v5 may be unable to bootstrap `MsalRedirectComponent`. To handle redirects, you **must** subscribe manually to `handleRedirectObservable`.

See the [guide to redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/redirects.md) for information on how to handle redirects with `handleRedirectObservable`.
