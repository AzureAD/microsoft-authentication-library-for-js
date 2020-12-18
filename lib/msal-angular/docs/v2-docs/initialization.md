# Initialization of MSAL Angular

Before using MSAL.js, [register an application in Azure AD](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app) to get your `clientId`.

In this document:
- [Initialization of MSAL](#initialization-of-msal-angular)
    - [Include and initialize the MSAL module in your app module](#include-and-initialize-the-msal-module-in-your-app-module)
    - [Secure the routes in your application](#secure-the-routes-in-your-application)
    - [Get tokens for Web API calls](#get-tokens-for-web-api-calls)
    - [Subscribe to event callbacks](#subscribe-to-event-callbacks)
- [Next Steps](#next-steps)



## Include and initialize the MSAL module in your app module

Import MsalModule into app.module.ts. To initialize MSAL module you are required to pass the clientId of your application which you can get from the application registration.

```js
@NgModule({
    imports: [
        MsalModule.forRoot({
            auth: {
                clientId: "Your client ID"
            }
        })
    ]
})
export class AppModule {}
```

## Secure the routes in your application

You can add authentication to secure specific routes in your application by just adding `canActivate: [MsalGuard]` to your route definition. It can be added at the parent or child routes. When a user visits these routes, the library will prompt the user to authenticate.

```js
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [MsalGuard]
  },
```

As of `@azure/msal-angular@2`, `canActivateChild` and `canLoad` have also been added to the guard, and can be added to your route definitions. You can see these used in our sample application [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular11-sample-app/src/app/app-routing.module.ts), as well as below: 

```js
  {
    path: 'profile',
    canActivateChild: [MsalGuard],
    children: [
      {
        path: '',
        component: ProfileComponent
      },
      {
        path: 'detail',
        component: DetailComponent
      }
    ]
  },
  { 
    path: 'lazyLoad', 
    loadChildren: () => import('./lazy/lazy.module').then(m => m.LazyModule),
    canLoad: [MsalGuard]
  },
```

## Get tokens for Web API calls

MSAL Angular allows you to add an Http interceptor (`MsalInterceptor`) in your `app.module.ts` as follows. MsalInterceptor will obtain tokens and add them to all your Http requests in API calls based on the `protectedResourceMap`.

```js
@NgModule({
    imports: [
        MsalModule.forRoot({ // MSAL Configuration
            auth: {
                clientId: "Your client ID"
            }
        }, {
            interactionType: InteractionType.Popup, // MSAL Guard Configuration
            authRequest: PopupRequest
        }, {
            protectedResourceMap: new Map([ // MSAL Interceptor Configuration
                ['https://graph.microsoft.com/v1.0/me', ['user.read']],
                ['https://api.myapplication.com/users/*', ['customscope.read']],
                ['http://localhost:4200/about/', null] 
            ])
        })
    ],
    providers: [
        ProductService, 
        {
            provide: HTTP_INTERCEPTORS,
            useClass: MsalInterceptor,
            multi: true
        }
    ]
})
export class AppModule {}
```

Using MsalInterceptor is optional and you can write your own interceptor if you choose to. Alternatively, you can also explicitly acquire tokens using the acquireToken APIs.

As of `@azure/msal-angular@2`, `protectedResourceMap` supports using `*` for wildcards. `unprotectedResources` is deprecated and no longer an option for configuration. Instead, setting a scope value of `null` on a resource will prevent it from getting tokens.

**Note:** When using wildcards, if multiple matching entries are found in the `protectedResourceMap`, the first match found will be used (based on the order of the `protectedResourceMap`).

## Subscribe to event callbacks

MSAL wrapper provides below callbacks for various operations. For all callbacks, you need to inject BroadcastService as a dependency in your component/service and also implement a `handleRedirectObservable`:

```js
this.authService.handleRedirectObservable().subscribe({
    next: (result) => // do something here
});
```

### 1. How to subscribe to events

```js
import { EventMessage, EventType } from '@azure/msal-browser';

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

You are ready to use MSAL Angular's [public APIs](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/public-apis.md)!
