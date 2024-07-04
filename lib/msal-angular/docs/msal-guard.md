# MSAL Guard

MSAL Angular provides `MsalGuard`, a class you can use to protect routes and require authentication before accessing the protected route. This doc provides more information about configuring and considerations when using the `MsalGuard`.

`MsalGuard` is a convenience class you can use improve the user experience, but it should not be relied upon for security. Attackers can potentially get around client-side guards, and you should ensure that the server does not return any data the user should not access.

You may also need a route guard that addresses specific needs. We encourage you to write your own guard if `MsalGuard` does not meet all those needs.

## Configurations

### Configuring the `MsalGuard` in the _app.module.ts_ and _app-routing.module.ts_

The `MsalGuard` can be added to your application as a provider in the _app.module.ts_, with its configuration. The imports takes in an instance of MSAL, as well as two Angular-specific configuration objects. The second argument is a [`MsalGuardConfiguration`](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/src/msal.guard.config.ts) object, which contain the values for `interactionType`, an optional `authRequest`, and an optional `loginFailedRoute`.

The `MsalGuard` is then used to protect routes in the _app-routing.module.ts_. The code sample below demonstrates adding the `MsalGuard` to the `Profile` route. Protecting the `Profile` route means that even if a user does not sign in using the `Login` button, if they try to access the `Profile` route or click the `Profile` button, the `MsalGuard` will prompt the user to authenticate via popup or redirect before showing the `Profile` page.

Your configuration may look like the below. See our [configuration doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/configuration.md) on other ways to configure MSAL Angular for your app, and the sections below for more details on the `MsalConfiguration` object and interfaces for routing.

```javascript
// app.module.ts
import { NgModule } from "@angular/core";
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { MsalModule, MsalRedirectComponent, MsalGuard } from "@azure/msal-angular"; // Import MsalInterceptor
import { InteractionType, PublicClientApplication } from "@azure/msal-browser";
import { AppComponent } from "./app.component";
import { AppRoutingModule } from "./app-routing.module";

@NgModule({
  declarations: [AppComponent],
  imports: [
    MsalModule.forRoot(
      new PublicClientApplication({
        // MSAL Configuration
      }),
      {
        // MSAL Guard Configuration
        interactionType: InteractionType.Redirect,
        authRequest: {
          scopes: ["user.read"],
        },
        loginFailedRoute: "/login-failed",
      },
      {
        // MSAL Interceptor Configurations
      }
    ),
    AppRoutingModule,
  ],
  providers: [
    // ...
    MsalGuard,
  ],
  bootstrap: [AppComponent, MsalRedirectComponent],
})
export class AppModule {}
```

```javascript
// app-routing.module.ts
import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";
import { HomeComponent } from "./home/home.component";
import { ProfileComponent } from "./profile/profile.component";
import { MsalGuard } from "@azure/msal-angular";

const routes: Routes = [
  {
    path: "profile",
    component: ProfileComponent,
    canActivate: [MsalGuard],
  },
  {
    path: "",
    component: HomeComponent,
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
```

### Interaction Type

Setting the interaction type determines how the `MsalGuard` will interactively prompt for login. The `InteractionType` can be imported from `@azure/msal-browser` and set to `Popup` or `Redirect`.

### Optional authRequest

The optional `authRequest` is an advanced featured that is not required. However, we recommend setting `authRequest` on the `MsalGuardConfiguration` with `scopes` so that consent may be obtained for the scopes upfront. If consent for `scopes` are not consented to upfront, scopes can be obtained incrementally. This may result in a consent dialogue being presented to your app user multiple times.

Consenting to scopes upfront is demonstrated in the code samples above, and in our [samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v3-samples).

All possible parameters for the request object can be found here: [`PopupRequest`](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_request_popuprequest_.html) and [`RedirectRequest`](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_request_redirectrequest_.html).

### Login Failed Route

The `loginFailedRoute` string can be set on `MsalGuardConfiguration`. The `MsalGuard` will redirect to this route if login is required and fails.

See the Angular sample for examples of implementing it in the [configuration](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v3-samples/angular15-sample-app/src/app/app.module.ts#L66) and [app routing module](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v3-samples/angular15-sample-app/src/app/app-routing.module.ts#L20).

Note that redirecting on failure is not available for Angular 9 applications that use the `CanLoad` interface due to base type differences.

### Interfaces

In addition to `canActivate`, `MsalGuard` also implements `canActivateChild` and `canLoad`, and these can be added to your route definitions in _app-routing.module.ts_. You can see these used in our [older MSAL Angular v2 Angular 11 sample application](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msal-lts/samples/msal-angular-v2-samples/angular11-sample-app/src/app/app-routing.module.ts), as well as below. For more information on interfaces, see the [Angular docs](https://angular.io/api/router).

```js
const routes: Routes = [
  {
    path: "profile",
    canActivateChild: [MsalGuard],
    children: [
      {
        path: "",
        component: ProfileComponent,
      },
      {
        path: "detail",
        component: DetailComponent,
      },
    ],
  },
  {
    path: "lazyLoad",
    loadChildren: () => import("./lazy/lazy.module").then((m) => m.LazyModule),
    canLoad: [MsalGuard],
  },
];
```

### Optional enableCheckForExpiredToken

```javascript
{
  ...
  enableCheckForExpiredToken?: boolean;
  minimumSecondsBeforeTokenExpiration?: number;
  silentAuthRequest?:
    | SilentRequest
    | ((authService: MsalService, state: RouterStateSnapshot) => SilentRequest);
  ...
}

```

The configuration property `enableCheckForExpiredToken` when set to `true` changes the behaviour of the msal guard in how to decide if an interactive login is required. When set to `true` the guard will only activate the route if we have a non expired token present. It can be configured that when token is expired, that a silent refresh is attempted to acquire a non expired token. If this succeeds the route is also activated.

The default behaviour of the msal guard ( `enableCheckForExpiredToken` not set or set to `false`) is decided by the predicate `this.authService.instance.getAllAccounts().length`, when falsey an interactive login is done.
The consequence is that an account can exist, but its token can be expired. In that case the MsalGuard will in the default behaviour allow the route to activate. This can still eventually result in an interactive login by the interceptor because the token could not be refreshed anymore (there is a time limit on refreshing tokens) If we want a stronger guarantee such as a non expired token is present then the property `enableCheckForExpiredToken` can be used.

When configuration property `enableCheckForExpiredToken` is set to `true`, then `authService.instance.getActiveAccount()` will be called.
If no active account then an interactive login will be called.
When there is an interactive Account, it will be checked if the token is not expired. This is done by comparing `now() in seconds + minimumSecondsBeforeTokenExpiration < token_expiration_in_seconds`.
So by setting the property `minimumSecondsBeforeTokenExpiration` you can ensure that token should be not expiring within `minimumSecondsBeforeTokenExpiration` seconds.
When the token is expired and the propery `silentAuthRequest` is set, then an attempt will be done to silently refresh the token.
If this succeeds no interactive login is required. If it fails an interactive login will be done

```javascript
// app.module.ts
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from "@angular/common/http";
import { MsalModule, MsalRedirectComponent, MsalGuard } from '@azure/msal-angular'; // Import MsalInterceptor
import { InteractionType, PublicClientApplication } from '@azure/msal-browser';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports: [
        MsalModule.forRoot( new PublicClientApplication({
            // MSAL Configuration
        }), {
            // MSAL Guard Configuration
            interactionType: InteractionType.Redirect,
            authRequest: {
                scopes: ['user.read']
            },
            loginFailedRoute: '/login-failed',
            enableCheckForExpiredToken: true,
            minimumSecondsBeforeTokenExpiration: 60,
            silentAuthRequest: (authService: MsalService, state: RouterStateSnapshot) =>{
                return { account:authService.instance.getActiveAccount(), scopes: [...] } as SilentRequest
            }
        }, {
            // MSAL Interceptor Configurations
        }),
        AppRoutingModule
    ],
    providers: [
        // ...
        MsalGuard
    ],
    bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule { }
```

## Considerations when using the MSAL Guard

### Using the MSAL Guard on the home page

Setting the `MsalGuard` on the initial page is our recommendation if you want users to be prompted to log in when they reach your application. We do not recommend calling `login` in the `ngOnInit` in `app.component.ts`, as this can cause looping with redirects.

Our additional recommendations depend on your routing strategy, and can be found in the sections below.

### Using the MSAL Guard with path routing

When using the `PathLocationStrategy` and redirects with your Angular app, we recommend using a dedicated route for redirects, which will help prevent looping. This route should also be your `redirectUri`, and should not be protected by the `MsalGuard`.

```javascript
const routes: Routes = [
  {
    path: "profile",
    component: ProfileComponent,
    canActivate: [MsalGuard],
  },
  {
    // Dedicated route for redirects
    path: "auth",
    component: MsalRedirectComponent,
  },
  {
    path: "",
    component: HomeComponent,
  },
];
```

To log users in upon reaching your app, when using the `PathLocationStrategy`, we recommend:

- Setting the `MsalGuard` on your initial page
- Set your `redirectUri` to `'http://localhost:4200/auth'`
- Adding an `'auth'` path to your routes, setting the `MsalRedirectComponent` as the component (this route should not be protected by the `MsalGuard`)
- Making sure the `MsalRedirectComponent` is bootstrapped
- Optionally: adding `MsalGuard` to all your routes if you want all your routes protected

Our [Angular 15 sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v3-samples/angular15-sample-app) uses the `PathLocationStrategy` and demonstrates how to protect routes with the `MsalGuard`.

### Using the MSAL Guard with hash routing

When using the `HashLocationStrategy` with your Angular app, we strongly recommend setting placeholder routes (such as `/code`) in your _app-routing.module.ts_ to prevent triggering the Angular router when AAD returns the auth code response in the hash, as you may experience issues completing authentication without doing so. These placeholder routes should not be protected by the `MsalGuard`, and should not point to a component that triggers interaction or makes protected API calls on page load.

```javascript
const routes: Routes = [
  {
    path: "profile",
    component: ProfileComponent,
    canActivate: [MsalGuard],
  },
  {
    // Needed for hash routing
    path: "code",
    component: HomeComponent,
  },
  {
    path: "",
    component: HomeComponent,
  },
];
```

The `redirectUri` in the MSAL Configuration should also be set to the home page.

To log users in upon reaching your app, when using the `HashLocationStrategy`, we recommend:

- Setting the `MsalGuard` on your initial page
- Not setting the `MsalGuard` on placeholder routes (e.g. `/code`, `/error`)
- Making sure the `MsalRedirectComponent` is bootstrapped
- Optionally: adding `MsalGuard` to all the rest of your routes if you want all your routes protected

See our [older MSAL Angular v2 Angular 11 sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msal-lts/samples/msal-angular-v2-samples/angular11-sample-app/src/app/app-routing.module.ts), which uses the `HashLocationStrategy` and demonstrates how to protect routes with `MsalGuard`.

## Changes from msal-angular v1 to v2

- **Configuration**: `MsalAngularConfiguration` has been deprecated and no longer works. Configuring the `MsalGuard` is now done through the `MsalGuardConfiguration`.
- **Interfaces**: `MsalGuard` now implements `CanActivateChild` and `CanLoad` in addition to `CanActivate`. See the section above on `Interfaces` for more details.
- **Redirect on failure**: `MsalGuard` configuration now has a `loginFailedRoute` that can be configured. See the section above on the `loginFailedRoute` for details.
