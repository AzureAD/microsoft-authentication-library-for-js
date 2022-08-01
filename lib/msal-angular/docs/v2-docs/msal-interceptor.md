# MSAL Interceptor

MSAL Angular provides an `Interceptor` class that automatically acquires tokens for outgoing requests that use the Angular `http` client to known protected resources. This doc provides more information about the configuring and using the `MsalInterceptor`.

While we recommend using the `MsalInterceptor` instead of the `acquireTokenSilent` API directly, please note that using the `MsalInterceptor` is optional. You may wish to explicitly acquire tokens using the acquireToken APIs instead.

Please note that the `MsalInterceptor` is provided for your convenience and may not fit all use cases. We encourage you to write your own interceptor if you have specific needs that are not addressed by the `MsalInterceptor`. 

## Configuration

### Configuring the `MsalInterceptor` in the *app.module.ts*

The `MsalInterceptor` can be added to your application as a provider in the *app.module.ts*, with its configuration. The imports takes in an instance of MSAL, as well as two Angular-specific configuration objects. The third argument is a [`MsalInterceptorConfiguration`](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/src/msal.interceptor.config.ts) object, which contain the values for `interactionType`, a `protectedResourceMap`, and an optional `authRequest`.

Your configuration may look like the below. See our [configuration doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/configuration.md) on other ways to configure MSAL Angular for your app. 

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

### Optional authRequest

For more information on the optional `authRequest` that can be set in the `MsalInterceptorConfiguration`, please see our [multi-tenant doc here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/multi-tenant.md#dynamic-auth-request).

## Changes from msal-angular v1 to v2

* Note that the `unprotectedResourceMap` in MSAL Angular v1's `MsalAngularConfiguration` has been deprecated and no longer works.
* `protectedResourceMap` has been moved to the `MsalInterceptorConfiguration` object, and can be passed as `Map<string, Array<string|ProtectedResourceScopes>>`. `MsalAngularConfiguration` has been deprecated and no longer works.
* Putting the root domain in the `protectedResourceMap` to protect all routes is no longer supported. Please use wildcard matching instead.

For more information on how to configure scopes, please see our [FAQs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md). 
