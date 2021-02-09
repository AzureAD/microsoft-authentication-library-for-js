# Using redirects in MSAL Angular 2.x

## Using redirects

Some users of MSAL find redirects confusing. The following are two approaches that we would recommend when using redirects:

### 1. Dedicated handleRedirectObservable component

This is our recommended approach for handling redirects:

- MSAL Angular 2.x provides a dedicated redirect component that can be imported  into your application. We recommend importing the `MsalRedirectComponent` and bootstrapping this alongside `AppComponent` in your application on the `app.module.ts`, as this will handle all redirects without your components needing to subscribe to `handleRedirectObservable()` manually.
- Pages that wish to perform functions following redirects (e.g. user account functions, UI changes, etc) should subscribe to the `inProgress$` subject, filtering for `InteractionStatus.None`. This will ensure that there are no interactions in progress when performing the functions. 
- See our [Angular 10](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular10-sample-app), [Angular 11](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular11-sample-app) and [Angular 11 B2C samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular11-b2c-sample) for examples of this approach.

msal.redirect.component.ts
```js
// This component is part of @azure/msal-angular and can be imported and bootstrapped
import { Component, OnInit } from "@angular/core";
import { MsalService } from "./msal.service.ts";

@Component({
  selector: 'app-redirect', // Selector to be added to index.html
  template: ''
})
export class MsalRedirectComponent implements OnInit {
  
  constructor(private authService: MsalService) { }
  
  ngOnInit(): void {    
      this.authService.handleRedirectObservable().subscribe();
  }
  
}

```

index.html
```js 
<body>
  <app-root></app-root>
  <app-redirect></app-redirect> // Selector for additional bootstrapped component
</body>
```

app.module.ts

```js
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { IPublicClientApplication, PublicClientApplication, InteractionType, BrowserCacheLocation, LogLevel } from '@azure/msal-browser';
import { MsalGuard, MsalInterceptor, MsalBroadcastService, MsalInterceptorConfiguration, MsalModule, MsalService, MSAL_GUARD_CONFIG, MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG, MsalGuardConfiguration, MsalRedirectComponent } from '@azure/msal-angular'; // Redirect component imported from msal-angular

const isIE = window.navigator.userAgent.indexOf("MSIE ") > -1 || window.navigator.userAgent.indexOf("Trident/") > -1;

export function loggerCallback(logLevel: LogLevel, message: string) {
  console.log(message);
}

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: '6226576d-37e9-49eb-b201-ec1eeb0029b6',
      redirectUri: 'http://localhost:4200',
      postLogoutRedirectUri: 'http://localhost:4200'
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: isIE, // set to true for IE 11
    },
    system: {
      loggerOptions: {
        loggerCallback,
        logLevel: LogLevel.Info,
        piiLoggingEnabled: false
      }
    }
  });
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/me', ['user.read']);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return { interactionType: InteractionType.Redirect };
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ProfileComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatButtonModule,
    MatToolbarModule,
    MatListModule,
    HttpClientModule,
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
    MsalService,
    MsalGuard,
    MsalBroadcastService
  ],
  bootstrap: [AppComponent, MsalRedirectComponent] // Redirect component bootstrapped here
})
export class AppModule { }

```

app.component.ts
```js
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MsalBroadcastService, InteractionStatus } from '@azure/msal-angular';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy {
  private readonly _destroying$ = new Subject<void>();

  constructor(
    private msalBroadcastService: MsalBroadcastService
  ) {}

  ngOnInit(): void {
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        // Do user account/UI functions here
      })
  }
```

### 2. Subscribing to handleRedirectObservable

This is not our recommended approach, but if you are unable to bootstrap the `MsalRedirectComponent`, we would suggest the following:

- `handleRedirectObservable()` should be subscribed to on every page to which a redirect may occur. Pages protected by the MSAL Guard do not need to subscribe to `handleRedirectObservable()`, as redirects are processed in the Guard.
- Accessing or performing any action related to user accounts should not be done until `handleRedirectObservable()` is complete. This prevents multiple `handleRedirectObservables()` being called, resulting in an `interaction_in_progress` error.
- See our [Angular 9 sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular9-v2-sample-app) for examples of this approach.

Example of home.component.ts file:
```js
import { Component, OnInit } from '@angular/core';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor(private authService: MsalService) { }

  ngOnInit(): void {
    this.authService.handleRedirectObservable().subscribe({
      next: (result: AuthenticationResult) => {
        // Perform actions related to user accounts here
      },
      error: (error) => console.log(error)
    });
  }

}
```
