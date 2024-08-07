# Initialization of MSAL Angular

Before using `@azure/msal-angular`, [register an application in Azure AD](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app) to get your `clientId`.

In this document:
- [Initialization of MSAL](#initialization-of-msal-angular)
    - [Include and initialize the MSAL module in your app module](#include-and-initialize-the-msal-module-in-your-app-module)
    - [Secure the routes in your application](#secure-the-routes-in-your-application)
    - [Get tokens for Web API calls](#get-tokens-for-web-api-calls)
    - [Subscribe to events](#subscribe-to-events)
- [Next Steps](#next-steps)

## Include and initialize the MSAL module in your app module

Import `MsalModule` into app.module.ts. To initialize MSAL module you are required to pass the clientId of your application which you can get from the application registration.

```js
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { MsalModule, MsalService, MsalGuard, MsalInterceptor, MsalBroadcastService, MsalRedirectComponent } from "@azure/msal-angular";
import { PublicClientApplication, InteractionType, BrowserCacheLocation } from "@azure/msal-browser";

@NgModule({
    imports: [
        MsalModule.forRoot( new PublicClientApplication({ // MSAL Configuration
            auth: {
                clientId: "Your client ID",
                authority: "Your authority",
                redirectUri: "Your redirect Uri",
            },
            cache: {
                cacheLocation : BrowserCacheLocation.LocalStorage,
                storeAuthStateInCookie: true, // set to true for IE 11
            },
            system: {
                loggerOptions: {
                    loggerCallback: () => {},
                    piiLoggingEnabled: false
                }
            }
        }), {
            interactionType: InteractionType.Redirect, // MSAL Guard Configuration
        }, {
            interactionType: InteractionType.Redirect, // MSAL Interceptor Configuration
        })
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: MsalInterceptor,
            multi: true
        },
        MsalService,
        MsalGuard,
        MsalBroadcastService
    ],
    bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule {}
```

Also add the app-redirect tag in order to initialize the `PublicClientApplication`.

```js
<html>
...
<body>
  <app-root></app-root>
  <app-redirect></app-redirect>
</body>
</html>
```

## Secure the routes in your application

You can add authentication to secure specific routes in your application by just adding `canActivate: [MsalGuard]` to your route definition. It can be added at the parent or child routes. When a user visits these routes, the library will prompt the user to authenticate.

See our [`MsalGuard` doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/msal-guard.md) for more details on configuration and considerations, including using additional interfaces.

See this example of a route defined with the `MsalGuard`:

```js
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { MsalGuard } from '@azure/msal-angular';

const routes: Routes = [
    {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [MsalGuard]
    },
    {
        path: '',
        component: HomeComponent
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }
```

## Get tokens for Web API calls

`@azure/msal-angular` allows you to add an Http interceptor (`MsalInterceptor`) in your `app.module.ts` as follows. The `MsalInterceptor` will obtain tokens and add them to all your Http requests in API calls based on the `protectedResourceMap`. See our [MsalInterceptor doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/msal-interceptor.md) for more details on configuration and use.

```js
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './app.component';
import { MsalModule, MsalService, MsalGuard, MsalInterceptor, MsalBroadcastService, MsalRedirectComponent } from "@azure/msal-angular";
import { PublicClientApplication, InteractionType, BrowserCacheLocation } from "@azure/msal-browser";

@NgModule({
    imports: [
        MsalModule.forRoot( new PublicClientApplication({ // MSAL Configuration
            auth: {
                clientId: "Your client ID",
                authority: "Your authority",
                redirectUri: "Your redirect Uri",
            },
            cache: {
                cacheLocation : BrowserCacheLocation.LocalStorage,
                storeAuthStateInCookie: true, // set to true for IE 11
            },
            system: {
                loggerOptions: {
                    loggerCallback: () => {},
                    piiLoggingEnabled: false
                }
            }
        }), {
            interactionType: InteractionType.Redirect, // MSAL Guard Configuration
        }, {
            interactionType: InteractionType.Redirect, // MSAL Interceptor Configuration
            protectedResourceMap: new Map([
                ['https://graph.microsoft.com/v1.0/me', ['user.read']],
                ['https://api.myapplication.com/users/*', ['customscope.read']],
                ['http://localhost:4200/about/', null] 
            ])
        })
    ],
    providers: [
        {
            provide: HTTP_INTERCEPTORS,
            useClass: MsalInterceptor,
            multi: true
        },
        MsalService,
        MsalGuard,
        MsalBroadcastService
    ],
    bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule {}
```

Using the `MsalInterceptor` is optional. You may wish to explicitly acquire tokens using the acquireToken APIs instead.

Please note that the `MsalInterceptor` is provided for your convenience and may not fit all use cases. We encourage you to write your own interceptor if you have specific needs that are not addressed by the `MsalInterceptor`. 

## Subscribe to events

MSAL provides an event system, which emits events related to auth and MSAL, and can be subscribed to as below. To use events, the `MsalBroadcastService` should be added to your constructor in your component/service. 

### 1. How to subscribe to events

```js
import { EventMessage, EventType } from '@azure/msal-browser';
import { filter } from 'rxjs/operators';

this.msalBroadcastService.msalSubject$
    .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS)
    )
    .subscribe((result) => {
        // do something here
    });
```

### 2. Available events

The list of events available to MSAL can be found in the [`@azure/msal-browser` event documentation.](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/events.md)

### 3. Unsubscribing

It is extremely important to unsubscribe. Implement `ngOnDestroy()` in your component and unsubscribe.

```js
import { EventMessage, EventType } from '@azure/msal-browser';
import { filter, Subject, takeUntil } from 'rxjs';

private readonly _destroying$ = new Subject<void>();

this.msalBroadcastService.msalSubject$
    .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
        takeUntil(this._destroying$)
    )
    .subscribe((result) => {
        this.checkAccount();
    });

ngOnDestroy(): void {
    this._destroying$.next(null);
    this._destroying$.complete();
}
```

# Next Steps

You are ready to use `@azure/msal-angular` [public APIs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/public-apis.md)!
