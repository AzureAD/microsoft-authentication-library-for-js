# MSAL Angular 2.x Configuration

MSAL for Angular can be configured in multiple ways:
- `MsalModule.forRoot`
- Factory providers

This guide will detail how to leverage each method for your application.

## Configuration Options

MSAL for Angular accepts three configuration objects:

1. [Configuration](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_config_configuration_.html): This is the same configuration object that is used for the core `@azure/msal-browser` library. All configuration options can be found [here](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_config_configuration_.html).
2. [`MsalGuardConfiguration`](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msal-angular-v2-alpha0/lib/msal-angular/src/msal.guard.config.ts): A set of options specifically for the Angular guard.
3. [`MsalInterceptorConfiguration`](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msal-angular-v2-alpha0/lib/msal-angular/src/msal.interceptor.config.ts): A set of options specifically for the Angular interceptor.

An `authRequest` object can be specified on `MsalGuardConfiguration` and `MsalInterceptorConfiguration`. While scopes is the only required parameter, all other possible parameters for the request object can be found here: [`PopupRequest`](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_request_popuprequest_.html) and [`RedirectRequest`](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-browser/modules/_src_request_redirectrequest_.html).

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
                knownAuthorities: [],
                cloudDiscoveryMetadata: "",
                redirectUri: "http://localhost:4200/",
                postLogoutRedirectUri: "http://localhost:4200/",
                navigateToLoginRequestUrl: true,
                clientCapabilities: []
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
            interactionType: InteractionType.Popup, // MSAL Guard Configuration
            authRequest: {
              scopes: ["User.Read"]
            }
        }, {
            interactionType: InteractionType.Redirect, // MSAL Interceptor Configuration
            protectedResourceMap,
            authRequest: {
              scopes: ["User.Read"]
            }
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

function MSALInstanceFactory(): IPublicClientApplication {
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

function MSALInterceptorConfigFactory(): MsalInterceptorConfig {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set("https://graph.microsoft.com/v1.0/me", ["user.read"]);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}

@NgModule({
  imports: [
    MsalModule.forRoot(
      MSALInstanceFactory(), {
        interactionType: InteractionType.Redirect
      }, MSALInterceptorConfigFactory()
    ),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    MsalGuard,
    MsalBroadcastService
    MsalService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```
