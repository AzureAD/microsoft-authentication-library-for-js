# MSAL Interceptor

MSAL Angular provides an `Interceptor` class that automatically acquires tokens for outgoing requests that use the Angular `http` client to known protected resources. This doc provides more information about the configuring and using the `MsalInterceptor`.

While we recommend using the `MsalInterceptor` instead of the `acquireTokenSilent` API directly, please note that using the `MsalInterceptor` is optional. You may wish to explicitly acquire tokens using the acquireToken APIs instead.

Please note that the `MsalInterceptor` is provided for your convenience and may not fit all use cases. We encourage you to write your own interceptor if you have specific needs that are not addressed by the `MsalInterceptor`. 

## Configuration

### Configuring the `MsalInterceptor` in the *app.module.ts*

The `MsalInterceptor` can be added to your application as a provider in the *app.module.ts*, with its configuration. The imports takes in an instance of MSAL, as well as two Angular-specific configuration objects. The third argument is a [`MsalInterceptorConfiguration`](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/src/msal.interceptor.config.ts) object, which contain the values for `interactionType`, a `protectedResourceMap`, and an optional `authRequest`.

Your configuration may look like the below. See our [configuration doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/configuration.md) on other ways to configure MSAL Angular for your app. 

```javascript
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { AppComponent } from './app.component';
import { MsalModule, MsalRedirectComponent, MsalGuard, MsalInterceptor } from '@azure/msal-angular'; // Import MsalInterceptor
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        MsalModule.forRoot( new PublicClientApplication({
            // MSAL Configuration
        }), {
            // MSAL Guard Configuration
        }, {
            // MSAL Interceptor Configurations
            interactionType: InteractionType.Redirect,
            protectedResourceMap: new Map([ 
                ['Enter_the_Graph_Endpoint_Here/v1.0/me', ['user.read']]
            ])
        })
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS, // Provides as HTTP Interceptor
            useClass: MsalInterceptor,
            multi: true
        },
        MsalGuard
    ],
    bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule { }
```

### Interaction Type

While the `MsalInterceptor` is designed to acquire tokens silently, in the event that a silent request fails, it will fall back to acquiring tokens interactively. The `InteractionType` can be imported from `@azure/msal-browser` and set to `Popup` or `Redirect`.

```javascript
{
    interactionType: InteractionType.Redirect,
    protectedResourceMap: new Map([ 
        ['Enter_the_Graph_Endpoint_Here/v1.0/me', ['user.read']]
    ])
}
```

### Protected Resource Map

The protected resources and corresponding scopes are provided as a `protectedResourceMap` in the `MsalInterceptor` configuration. 

The URLs you provide in the `protectedResourceMap` collection are case-sensitive. For each resource, add scopes being requested to be returned in the access token.

For example:

* `["user.read"]` for Microsoft Graph
* `["<Application ID URL>/scope"]` for custom web APIs (that is, `api://<Application ID>/access_as_user`)


Scopes can be specified for a resource in the following ways:

1. An array of scopes, which will be added to every HTTP request to that resource, regardless of HTTP method.

    ```javascript
    {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: new Map<string, Array<string> | null>([
            ["https://graph.microsoft.com/v1.0/me", ["user.read", "profile"]],
            ["https://myapplication.com/user/*", ["customscope.read"]]
        ]),
    }
    ```

1. An array of `ProtectedResourceScopes`, which will attach scopes only for specific HTTP methods. 

    ```javascript
    {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: new Map<string, Array<string|ProtectedResourceScopes> | null>([
            ["https://graph.microsoft.com/v1.0/me", ["user.read"]],
            ["http://myapplication.com", [
                {
                    httpMethod: "POST",
                    scopes: ["write.scope"]
                }
            ]]
        ])
    }
    ```

    Note that scopes for a resource can contain a combination of strings and `ProtectedResourceScopes`. In the below example, a `GET` request will have the scopes `"all.scope"` and `"read.scope"`, whereas as `PUT` request would just have `"all.scope"`.

    ```javascript
    {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: new Map<string, Array<string|ProtectedResourceScopes> | null>([
            ["http://myapplication.com", [
                "all.scope",
                {
                    httpMethod: "GET",
                    scopes: ["read.scope"]
                },
                {
                    httpMethod: "POST",
                    scopes: ["info.scope"]
                }
            ]]
        ])
    }
    ```

1. A scope value of `null`, indicating that a resource is to be unprotected and will not get tokens. Resources not included in the `protectedResourceMap` are not protected by default. Specifying a particular resource to be unprotected can be useful when some routes on a resource are to be protected, and some are not. Note that the order in `protectedResourceMap` matters, so null resource should be put before any similar base urls or wildcards.

    ```javascript
    {
        interactionType: InteractionType.Redirect,
        protectedResourceMap: new Map<string, Array<string> | null>([
            ["https://graph.microsoft.com/v1.0/me", ["user.read", "profile"]],
            ["https://myapplication.com/unprotected", null],
            ["https://myapplication.com/unprotected/post", [{ httpMethod: 'POST', scopes: null }]],
            ["https://myapplication.com", ["custom.scope"]]
        ]),
    }
    ```

Other things to note regarding the `protectedResourceMap`:

* **Wildcards**: `protectedResourceMap` supports using `*` for wildcards. When using wildcards, if multiple matching entries are found in the `protectedResourceMap`, the first match found will be used (based on the order of the `protectedResourceMap`). 
* **Relative paths**: If there are relative resource paths in your application, you may need to provide the relative path in the `protectedResourceMap`. This also applies to issues that may arise with ngx-translate. Be aware that the relative path in your `protectedResourceMap` may or may not need a leading slash depending on your app, and may need to try both.

### Strict Matching (`strictMatching`)

In msal-angular v5, URL component pattern matching for `protectedResourceMap` entries uses strict matching semantics by default. The `strictMatching` field on `MsalInterceptorConfiguration` controls this behaviour.

> **⚠️ Important:** If your application sets `protectedResourceMap` keys dynamically (e.g. from environment files, `APP_INITIALIZER`, or JSON configuration) and those keys are base URLs without sub-paths or wildcards, strict matching can silently prevent the `Authorization` header from being attached, resulting in **401 errors with no build-time error and no per-request warning — only a one-time initialization warning if `strictMatching` is left unconfigured**. See [Troubleshooting strict matching](#troubleshooting-strict-matching) below.

#### What strict matching changes

| Behaviour | Legacy (`strictMatching: false`) | Strict (default in v5) |
|-----------|----------------------------------|------------------------|
| Metacharacter escaping | `.` and other regex metacharacters are **not** escaped; they act as regex operators | All metacharacters (including `.`) are treated as **literals** |
| Anchoring | Pattern may match anywhere within the string | Pattern must match the **full string** (`^…$`) |
| Host wildcard (`*`) | `*` matches any character sequence, including `.` | `*` matches any character sequence that does **not** include `.` (wildcards stay within a single DNS label) |
| Path/search/hash wildcard (`*`) | `*` matches any character sequence | `*` matches any character sequence (unchanged) |
| `?` character | Passed through to the underlying regex | Treated as a **literal** `?` (URL query-string separator, not a wildcard) |

With strict matching (the v5 default):
- A pattern like `*.contoso.com` matches `app.contoso.com` but **not** `a.b.contoso.com` (wildcard cannot span dot separators).
- A pattern like `https://graph.microsoft.com/v1.0/me` matches only that exact URL.

#### Common failure patterns

The following `protectedResourceMap` key patterns work under legacy matching but silently fail with strict matching:

| Key pattern | Outgoing request URL | Result under strict matching | Fix |
|---|---|---|---|
| `https://api.example.com` | `https://api.example.com/v1/users` | ❌ No match — key resolves to path `/`, request has path `/v1/users` | `https://api.example.com/*` |
| `https://api.example.com/` | `https://api.example.com/v1/users` | ❌ No match — trailing slash anchors the pattern to exactly `/` | `https://api.example.com/*` |
| `environment.apiConfig.uri` (e.g. `https://api.example.com`) | `https://api.example.com/v1/users` | ❌ No match — same as above | `` `${environment.apiConfig.uri}/*` `` |

#### Default behaviour in v5 (no configuration needed)

Strict matching is enabled by default. No additional configuration is required:

```javascript
{
    interactionType: InteractionType.Redirect,
    protectedResourceMap: new Map([
        // Use wildcards or exact paths so strict matching works correctly
        ["https://*.contoso.com/api/*", ["contoso.scope"]],
        ["https://graph.microsoft.com/v1.0/me", ["user.read"]]
    ])
    // strictMatching defaults to true in v5
}
```

#### Opting out to legacy matching (`strictMatching: false`)

If your patterns rely on the looser matching from v4, you can set `strictMatching: false` to retain the legacy behaviour temporarily:

> **Note:** Legacy matching (`strictMatching: false`) is provided for backwards compatibility and may be removed in a future major version. We recommend updating your `protectedResourceMap` patterns to work with strict matching.

```javascript
{
    interactionType: InteractionType.Redirect,
    protectedResourceMap: new Map([
        ["https://*.contoso.com/api", ["contoso.scope"]],
        ["https://graph.microsoft.com/v1.0/me", ["user.read"]]
    ]),
    strictMatching: false  // Use legacy matching for backwards compatibility
}
```

#### Guidance for environment-driven configurations

If your `protectedResourceMap` keys reference Angular `environment` values (e.g. `environment.apiConfig.uri`), check whether those values are **exact paths** (e.g. `https://graph.microsoft.com/v1.0/me`) or **bare base URLs** (e.g. `https://api.example.com`). Exact paths work correctly with strict matching and need no special handling:

```javascript
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  // environment.apiConfig.uri is an exact path (e.g. "https://graph.microsoft.com/v1.0/me")
  // — strict matching works correctly
  protectedResourceMap.set(environment.apiConfig.uri, environment.apiConfig.scopes);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}
```

If the environment value is a bare base URL and you need to match sub-paths, append a `/*` wildcard:

```javascript
  // environment.apiConfig.uri is a base URL (e.g. "https://api.example.com")
  // Append /* to match all sub-paths
  protectedResourceMap.set(`${environment.apiConfig.uri}/*`, environment.apiConfig.scopes);
```

For truly **dynamic** configurations where the key shape is unknown at build time (e.g. `APP_INITIALIZER`, JSON loaded via `fetch`, or `platformBrowserDynamic`), set `strictMatching: false` as a temporary safe default. See [Fix options → Option B](#fix-options) below for a code example.

#### Troubleshooting strict matching

##### Symptoms

- API requests return **401 Unauthorized** after upgrading to `@azure/msal-angular` v5 (or between v5 minor versions such as 5.0.x → 5.1.x).
- The `Authorization: Bearer <token>` header is **missing** from outgoing HTTP requests.
- No build-time or runtime errors are reported — the failure is **silent**.
- The issue may only appear in certain environments (e.g. staging/production) where the API base URL differs from development.

##### Fix options

**Option A: Update keys to work with strict matching (recommended)**

Update your `protectedResourceMap` keys to use exact paths or wildcards that match under strict matching rules. This is the preferred approach because strict matching is safer and more predictable:

```javascript
{
    interactionType: InteractionType.Redirect,
    protectedResourceMap: new Map([
        // Exact path — matches only this URL
        ["https://graph.microsoft.com/v1.0/me", ["user.read"]],
        // Wildcard — matches all sub-paths of the API
        ["https://api.example.com/v1/*", ["api.scope"]]
    ])
    // strictMatching defaults to true — no need to set it
}
```

**Option B: Set `strictMatching: false` (fallback for dynamic configurations)**

If your `protectedResourceMap` keys are loaded dynamically at runtime (e.g. from `APP_INITIALIZER`, JSON config, or `platformBrowserDynamic`) and you cannot guarantee they contain exact paths or wildcards, set `strictMatching: false` as a temporary safe default:

```javascript
{
    interactionType: InteractionType.Redirect,
    protectedResourceMap: new Map([
        [config.apiUri, config.apiScopes]
    ]),
    // Dynamic keys may be base URLs without wildcards.
    // Remove once keys are migrated to exact paths or wildcard patterns.
    strictMatching: false
}
```

> **Note:** Legacy matching (`strictMatching: false`) is provided for backwards compatibility and may be removed in a future major version.

##### Runtime warning

`MsalInterceptor` emits a **one-time runtime warning** via the MSAL logger during initialization when `strictMatching` is not explicitly configured. If you see this warning, follow the fix options above.

### Optional authRequest

For more information on the optional `authRequest` that can be set in the `MsalInterceptorConfiguration`, please see our [multi-tenant doc here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/multi-tenant.md#dynamic-auth-request).

## Changes from msal-angular v1 to v2

* Note that the `unprotectedResourceMap` in MSAL Angular v1's `MsalAngularConfiguration` has been deprecated and no longer works.
* `protectedResourceMap` has been moved to the `MsalInterceptorConfiguration` object, and can be passed as `Map<string, Array<string|ProtectedResourceScopes>>`. `MsalAngularConfiguration` has been deprecated and no longer works.
* Putting the root domain in the `protectedResourceMap` to protect all routes is no longer supported. Please use wildcard matching instead.

For more information on how to configure scopes, please see our [FAQs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md). 
