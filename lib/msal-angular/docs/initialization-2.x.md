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

You can add authentication to secure specific routes in your application by just adding `canActivate : [MsalGuard]` to your route definition. It can be added at the parent or child routes.

```js
{
    path: 'product',
    component: ProductComponent,
    canActivate: [MsalGuard],
    children: [
        {
            path: 'detail/:id',
            component: ProductDetailComponent
        }
    ]
}, {
    path: 'myProfile',
    component: MsGraphComponent,
    canActivate: [MsalGuard]
},
```

When a user visits these routes, the library will prompt the user to authenticate.

## Get tokens for Web API calls

MSAL Angular allows you to add an Http interceptor (`MsalInterceptor`) in your `app.module.ts` as follows. MsalInterceptor will obtain tokens and add them to all your Http requests in API calls based on the `protectedResourceMap`.

```js
@NgModule({
    imports: [
        MsalModule.forRoot({
            auth: {
                clientId: "Your client ID"
            }
        }, {
        //MsalGuardConfiguation here
        }, {
            protectedResourceMap: new Map([
                ['https://graph.microsoft.com/v1.0/me', ['user.read']],
                ['https://api.myapplication.com/users/*', ['customscope.read']]
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

As of `@azure/msal-angular@2`protectedResourceMap` supports wildcard patterns that are supported by [minimatch](https://github.com/isaacs/minimatch). `unprotectedResources` is deprecated and no longer an option fpr configuration. 

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
this.msalBroadcastService.msalSubject$
    .pipe(
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS)
    )
    .subscribe((result) => {
        // do something here
    });
```

### 2. List of available events

To subscribe to different events, replace the above `EventType` with one of the following:

```js
export enum EventType {
    LOGIN_START = "msal:loginStart",
    LOGIN_SUCCESS = "msal:loginSuccess",
    LOGIN_FAILURE = "msal:loginFailure",
    ACQUIRE_TOKEN_START = "msal:acquireTokenStart",
    ACQUIRE_TOKEN_SUCCESS = "msal:acquireTokenSuccess",
    ACQUIRE_TOKEN_FAILURE = "msal:acquireTokenFailure",
    ACQUIRE_TOKEN_NETWORK_START = "msal:acquireTokenFromNetworkStart",
    SSO_SILENT_START = "msal:ssoSilentStart",
    SSO_SILENT_SUCCESS = "msal:ssoSilentSuccess",
    SSO_SILENT_FAILURE = "msal:ssoSilentFailure",
    HANDLE_REDIRECT_START = "msal:handleRedirectStart",
    LOGOUT_START = "msal:logoutStart",
    LOGOUT_SUCCESS = "msal:logoutSuccess",
    LOGOUT_FAILURE = "msal:logoutFailure"
}
```

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

You are ready to use MSAL Angular's [public APIs](./public-apis.md)!