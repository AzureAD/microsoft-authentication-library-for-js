# Initialization MSAL-Angular v1

## Prerequisites

Before using MSAL.js, [register an application in Azure AD](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app) to get your `clientId`.

### 1. Include and initialize the MSAL module in your app module.

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

### 2. Secure the routes in your application

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

### 3. Get tokens for Web API calls

MSAL Angular allows you to add an Http interceptor (`MsalInterceptor`) in your `app.module.ts` as follows. MsalInterceptor will obtain tokens and add them to all your Http requests in API calls based on the `protectedResourceMap`.

```js
@NgModule({
    imports: [
        MsalModule.forRoot({
            auth: {
                clientId: "Your client ID"
            }
        }, {
            protectedResourceMap: [
                ['https://graph.microsoft.com/v1.0/me', ['user.read']],
                ['https://api.myapplication.com/users/*', ['customscope.read']]
            ]
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

As of `@azure/msal-angular@1.1.0`, `protectedResourceMap` supports wildcard patterns that are supported by [minimatch](https://github.com/isaacs/minimatch), and `unprotectedResources` is deprecated and ignored. 

**Note:** When using wildcards, if multiple matching entries are found in the `protectedResourceMap`, the first match found will be used (based on the order of the `protectedResourceMap`).

### 4. Subscribe to event callbacks

MSAL wrapper provides below callbacks for various operations. For all callbacks, you need to inject BroadcastService as a dependency in your component/service and also implement a `handleRedirectCallback`:

```js
this.authService.handleRedirectCallback((authError, response) => {
    // do something here
});
```

1. Login-related events (`loginPopup`/`loginRedirect`)

```js
this.broadcastService.subscribe("msal:loginFailure", payload => {
    // do something here
});

this.broadcastService.subscribe("msal:loginSuccess", payload => {
    // do something here
});
```

2. Token-related events (`acquireTokenSilent()`/`acquireTokenPopup()`/`acquireTokenRedirect()`)

```js
this.broadcastService.subscribe("msal:acquireTokenSuccess", payload => {
    // do something here
});

this.broadcastService.subscribe("msal:acquireTokenFailure", payload => {
    // do something here
});
```

3. SSO-related events (`ssoSilent()`)

```js
this.broadcastService.subscribe("msal:ssoSuccess", payload => {
    // do something here
});

this.broadcastService.subscribe("msal:ssoFailure", payload => {
    // do something here
});
```

4. It is extremely important to unsubscribe. Implement `ngOnDestroy()` in your component and unsubscribe.

```js
 private subscription: Subscription;

 this.subscription = this.broadcastService.subscribe("msal:acquireTokenFailure", (payload) => {});

 ngOnDestroy() {
    this.broadcastService.getMSALSubject().next(1);
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
```