# MSAL Angular v1 Configuration

MSAL for Angular can configured in multiple ways:

- `MsalModule.forRoot`
- Factory providers
- `platformBrowserDynamic`
- `APP_INITIALIZER`

This guide will detail how to leverage each method for your application.

## Configuration Options

MSAL for Angular accepts to configuration objects:

1. [Configuration](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-core/modules/_configuration_.html#configuration): This is the same configuration object that is used for the core `msal@1` library.
2. [MsalAngularConfiguration](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-angular/modules/_msal_angular_configuration_.html): A set of options specifically for the Angular library.

## MsalModule.forRoot

The `MsalModule` class contains a static method that can be called in your `app.module.ts` file:

```typescript
import { MsalModule, MsalService, MsalInterceptor } from '@azure/msal-angular';

@NgModule({
    imports: [
        MsalModule.forRoot({
            auth: {
                clientId: 'clientid',
                authority: "https://login.microsoftonline.com/common/",
                validateAuthority: true,
                redirectUri: "http://localhost:4200/",
                postLogoutRedirectUri: "http://localhost:4200/",
                navigateToLoginRequestUrl: true,
            },
            cache: {
                cacheLocation : "localStorage",
                storeAuthStateInCookie: true, // set to true for IE 11
            },
            framework: {
                protectedResourceMap: new Map(protectedResourceMap)
            },
            system: {
                logger: new Logger(loggerCallback, options)
            }
        }, {
            popUp: !isIE,
            consentScopes: [ "user.read", "openid", "profile", "api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user"],
            extraQueryParameters: {}
        })
    ],
    providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: MsalInterceptor,
          multi: true
        },
        MsalService
    ]
})
export class AppModule {}
```

## Factory Providers

`MsalModule.forRoot` may not work in all scenarios, such as when you are using Angular v9 with the Ivy compiler enabled. Instead of `MsalModule.forRoot`, you can provide the configuration options via factory providers.

```typescript
import {
  MsalModule,
  MsalInterceptor,
  MSAL_CONFIG,
  MSAL_CONFIG_ANGULAR,
  MsalService,
  MsalAngularConfiguration
} from '@azure/msal-angular';
import { Configuration } from 'msal';

function MSALConfigFactory(): Configuration {
  return {
    auth: {
      clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
      authority: "https://login.microsoftonline.com/common/",
      validateAuthority: true,
      redirectUri: "http://localhost:4200/",
      postLogoutRedirectUri: "http://localhost:4200/",
      navigateToLoginRequestUrl: true,
    },
    cache: {
      cacheLocation: "localStorage",
      storeAuthStateInCookie: isIE, // set to true for IE 11
    },
  };
}

function MSALAngularConfigFactory(): MsalAngularConfiguration {
  return {
    popUp: !isIE,
    consentScopes: [
      "user.read",
      "openid",
      "profile",
      "api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user"
    ],
    protectedResourceMap,
    extraQueryParameters: {}
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
      provide: MSAL_CONFIG,
      useFactory: MSALConfigFactory
    },
    {
      provide: MSAL_CONFIG_ANGULAR,
      useFactory: MSALAngularConfigFactory
    },
    MsalService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

## platformBrowserDynamic

If you need to dynamically configure MSAL Angular (e.g. based on values returned from an API), you can use `platformBrowserDynamic`.

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
import { MSAL_CONFIG, MSAL_CONFIG_ANGULAR } from '@azure/msal-angular';

if (environment.production) {
  enableProdMode();
}

fetch('/assets/configuration.json')
  .then(response => response.json())
  .then(json => {
    platformBrowserDynamic([
      { provide: MSAL_CONFIG, useValue: json.msal },
      { provide: MSAL_CONFIG_ANGULAR, useValue: json.angular }
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
      "clientId": "6226576d-37e9-49eb-b201-ec1eeb0029b6",
      "authority": "https://login.microsoftonline.com/common/",
      "validateAuthority": true,
      "redirectUri": "http://localhost:4200/",
      "navigateToLoginRequestUrl": true
    },
    "cache": {
      "cacheLocation": "localStorage",
      "storeAuthStateInCookie": true
    }
  },
  "angular": {
    "popUp": false,
    "consentScopes": [
      "user.read",
      "openid",
      "profile",
      "api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user"
    ],
    "protectedResourceMap": [
      ["https://graph.microsoft.com/v1.0/me", ["user.read"]]
    ],
    "extraQueryParameters": {}
  }
}
```

## APP_INITIALIZER

An example of how to use the `APP_INITIALIZER` [injection token](https://angular.io/api/core/APP_INITIALIZER) to dynamically configure MSAL for Angular can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/1403).

