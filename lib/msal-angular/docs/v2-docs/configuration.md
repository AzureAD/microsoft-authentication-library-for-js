# MSAL Angular 2.x Configuration

MSAL for Angular can be configured in multiple ways:
- `MsalModule.forRoot`
- Factory providers
- `platformBrowserDynamic`

This guide will detail how to leverage each method for your application.

## Configuration Options

MSAL for Angular accepts three configuration objects:

1. [Configuration](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_config_configuration_.html): This is the same configuration object that is used for the core `@azure/msal-browser` library. All configuration options can be found [here](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_config_configuration_.html).
2. [`MsalGuardConfiguration`](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/src/msal.guard.config.ts): A set of options specifically for the Angular guard.
3. [`MsalInterceptorConfiguration`](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/src/msal.interceptor.config.ts): A set of options specifically for the Angular interceptor.

### Angular-specific configurations

* An `interactionType` must be specified on `MsalGuardConfiguration` and `MsalInterceptorConfiguration`, and can be set to `Popup` or `Redirect`.
* An `authRequest` object can be specified on `MsalGuardConfiguration` and `MsalInterceptorConfiguration` to set additional options. This is an advanced featured that is not required. All possible parameters for the request object can be found here: [`PopupRequest`](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_request_popuprequest_.html) and [`RedirectRequest`](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_request_redirectrequest_.html).
* The `protectedResourceMap` object on `MsalInterceptorConfiguration` is used to protect routes. See the [upgrade guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/1.x-2.x-upgrade-guide.md) to see how to use wildcards, and how this differs from MSAL 1.x.
* The `loginFailedRoute` string can be set on `MsalGuardConfiguration`. Msal Guard will redirect to this route if login is required and fails.

### Configuration for redirects

We recommend importing `MsalRedirectComponent` and bootstrapping with the `AppComponent` if you intend to use redirects. Please see the [redirect documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/redirects.md) for more details. 

## MsalModule.forRoot

The `MsalModule` class contains a static method that can be called in your `app.module.ts` file:

```typescript
import { MsalModule, MsalService, MsalGuard, MsalInterceptor } from "@azure/msal-angular";
import { IPublicClientApplication, PublicClientApplication, InteractionType, BrowserCacheLocation } from "@azure/msal-browser";

@NgModule({
    imports: [
        MsalModule.forRoot({ // MSAL Configuration
            auth: {
                clientId: "clientid",
                authority: "https://login.microsoftonline.com/common/",
                redirectUri: "http://localhost:4200/",
                postLogoutRedirectUri: "http://localhost:4200/",
                navigateToLoginRequestUrl: true
            },
            cache: {
                cacheLocation : BrowserCacheLocation.LocalStorage,
                storeAuthStateInCookie: true, // set to true for IE 11
            }
            system: {
                loggerOptions: {
                    loggerCallback: () => {},
                    piiLoggingEnabled: false
                }
            }
        }, {
            interactionType: InteractionType.Popup // MSAL Guard Configuration
            loginFailedRoute: "/login-failed" 
        }, {
            interactionType: InteractionType.Redirect, // MSAL Interceptor Configuration
            protectedResourceMap
        })
    ],
    providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: MsalInterceptor,
          multi: true
        },
        MsalGuard
    ]
})
export class AppModule {}
```

## Factory Providers

You may also provide the configuration options via factory providers.

```typescript
import {
  MsalModule,
  MsalService,
  MsalInterceptor,
  MsalInterceptorConfig,
  MsalGuard,
  MsalGuardConfig
} from "@azure/msal-angular";
import { IPublicClientApplication, PublicClientApplication, InteractionType, BrowserCacheLocation } from "@azure/msal-browser";

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: "6226576d-37e9-49eb-b201-ec1eeb0029b6",
      redirectUri: "http://localhost:4200",
      postLogoutRedirectUri: "http://localhost:4200"
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: isIE, // set to true for IE 11
    },
  });
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfig {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set("https://graph.microsoft.com/v1.0/me", ["user.read"]);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return { 
    interactionType: InteractionType.Redirect,
    loginFailedRoute: "./login-failed"
  };
}

@NgModule({
  imports: [
    MsalModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },
    MsalGuard,
    MsalBroadcastService
    MsalService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## platformBrowserDynamic

If you need to dynamically configure MSAL Angular (e.g. based on values returned from an API), you can use `platformBrowserDynamic`. `platformBrowserDyamic` is a platform factory, used to bootstrap the application, and is able to take in configuration options. `platformBrowserDynamic` should already be present when the Angular application is set up.

The following is an example of how to dynamically configure MSAL Angular with `platformBrowserDynamic` and a json file:

`app.module.ts`
```typescript
import {
  MsalModule,
  MsalInterceptor,
  MsalService,
} from '@azure/msal-angular';

@NgModule({
  imports: [
    MsalModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    MsalService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

`main.ts`
```typescript
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { MSAL_INSTANCE, MSAL_GUARD_CONFIG, MSAL_INTERCEPTOR_CONFIG } from '@azure/msal-angular';
import { PublicClientApplication, Configuration } from '@azure/msal-browser';

if (environment.production) {
  enableProdMode();
}

function loggerCallback(logLevel: LogLevel, message: string) {
  console.log("MSAL Angular: ", message);
}

fetch('/assets/configuration.json')
  .then(response => response.json())
  .then(json => {
    platformBrowserDynamic([
      { provide: MSAL_INSTANCE, useValue: new PublicClientApplication({
        auth: json.msal.auth,
        cache: json.msal.cache,
        system: {
          loggerOptions: {
            loggerCallback,
            logLevel: LogLevel.Info,
            piiLoggingEnabled: false
          }
        }
      }) },
      { provide: MSAL_GUARD_CONFIG, useValue: {
        interactionType: json.guard.interactionType,
        loginFailedRoute: json.guard.loginFailedRoute
      } as MsalGuardConfiguration },
      { provide: MSAL_INTERCEPTOR_CONFIG, useValue: {
        interactionType: json.interceptor.interactionType,
        protectedResourceMap: new Map(json.interceptor.protectedResourceMap)
      } as MsalInterceptorConfiguration },
    ])
      .bootstrapModule(AppModule)
      .catch(err => console.error(err));
  });
```

`src/assets/configuration.json`
```json
{
  "msal": {
    "auth": {
      "clientId": "clientid",
      "authority": "https://login.microsoftonline.com/common/",
      "redirectUri": "http://localhost:4200/",
      "postLogoutRedirectUri": "http://localhost:4200/",
      "navigateToLoginRequestUrl": true
    },
    "cache": {
      "cacheLocation": "localStorage",
      "storeAuthStateInCookie": true
    }
  },
  "guard": {
    "interactionType": "redirect",
    "loginFailedRoute": "/login-failed" 
  },
  "interceptor": {
    "interactionType": "redirect",
    "protectedResourceMap": [
      ["https://graph.microsoft.com/v1.0/me", ["user.read"]]
    ]
  }
}
```
