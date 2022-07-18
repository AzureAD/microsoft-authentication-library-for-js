# Events in MSAL Angular v2

Before you start here, make sure you understand how to [initialize the application object](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/initialization.md).

`@azure/msal-angular` uses the event system exposed by `@azure/msal-browser`, which emits events related to auth and MSAL, and can be used for updating UI, showing error messages, and so on.

## Consuming events in your app

Events in `@azure/msal-angular` are managed by the `MsalBroadcastService`, and are available by subscribing to the `msalSubject$` observable on the `MsalBroadcastService`. 

Here is an example of how you can consume the emitted events in your application:
```javascript
import { MsalBroadcastService } from '@azure/msal-angular';
import { EventMessage, EventType } from '@azure/msal-browser';

export class AppComponent implements OnInit, OnDestroy {
  private readonly _destroying$ = new Subject<void>();

  constructor(
    //...
    private msalBroadcastService: MsalBroadcastService
  ) {}

  ngOnInit(): void {
    this.msalBroadcastService.msalSubject$
      .pipe(
        // Optional filtering of events.
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS), 
        takeUntil(this._destroying$)
      )
      .subscribe((result: EventMessage) => {
        // Do something with the result
      });
  }

  ngOnDestroy(): void {
    this._destroying$.next(null);
    this._destroying$.complete();
  }
}
```

Note that you may need to cast the `result.payload` as a specific type to prevent compilation errors. The payload type will depend on the event, and can be found in our documentation [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/events.md).

```javascript
ngOnInit(): void {
  this.msalBroadcastService.msalSubject$
    .pipe(
      filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_SUCCESS),
    )
    .subscribe((result: EventMessage) => {
      // Casting payload as AuthenticationResult to access account
      const payload = result.payload as AuthenticationResult;
      this.authService.instance.setActiveAccount(payload.account);
    });
}
```

For the full example of using events, please see our sample [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/d46c4455243bd51767f669a13fbb717d786c6716/samples/msal-angular-v2-samples/angular11-sample-app/src/app/home/home.component.ts#L17).

## Table of events

For more information about the `EventMessage` object, including the full table of events currently emitted by `@azure/msal-browser` (including descriptions and related payloads), please see the documentation [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/events.md).

## Handling errors with events

As the `EventError` in `EventMessage` is defined as `AuthError | Error | null`, an error should be validated as the correct type before accessing specific properties on it. 

See the example below of how an error can be cast to `AuthError` to avoid TypeScript errors:

```javascript
import { MsalBroadcastService } from '@azure/msal-angular';
import { EventMessage, EventType } from '@azure/msal-browser';

export class AppComponent implements OnInit, OnDestroy {
  private readonly _destroying$ = new Subject<void>();

  constructor(
    //...
    private msalBroadcastService: MsalBroadcastService
  ) {}

  ngOnInit(): void {
    this.msalBroadcastService.msalSubject$
      .pipe(
        // Optional filtering of events
        filter((msg: EventMessage) => msg.eventType === EventType.LOGIN_FAILURE), 
        takeUntil(this._destroying$)
      )
      .subscribe((result: EventMessage) => {
        if (result.error instanceof AuthError) {
          // Do something with the error
        }
      });
  }

  ngOnDestroy(): void {
    this._destroying$.next(null);
    this._destroying$.complete();
  }
}
```

An example of error handling can also be found on our [MSAL Angular v2 B2C Sample App](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/4d79b8ebacd7e4d9acf80fd69d602346dee6bf3c/samples/msal-angular-v2-samples/angular11-b2c-sample/src/app/app.component.ts#L68).

## Syncing logged in state across tabs and windows

If you would like to update your UI when a user logs in or out of your app in a different tab or window you can subscribe to the `ACCOUNT_ADDED` and `ACCOUNT_REMOVED` events. The payload will be the `AccountInfo` object that was added or removed.

```javascript
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { EventMessage, EventType } from '@azure/msal-browser';

export class AppComponent implements OnInit, OnDestroy {
  private readonly _destroying$ = new Subject<void>();

  constructor(
    //...
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService
  ) {}

  ngOnInit(): void {
    this.authService.instance.enableAccountStorageEvents(); // Register the storage listener that will be emitting the events
    this.msalBroadcastService.msalSubject$
      .pipe(
        // Optional filtering of events
        filter((msg: EventMessage) => msg.eventType === EventType.ACCOUNT_ADDED || msg.eventType === EventType.ACCOUNT_REMOVED), 
        takeUntil(this._destroying$)
      )
      .subscribe((result: EventMessage) => {
        if (this.authService.msalInstance.getAllAccounts().length === 0) {
          // Account logged out in a different tab, redirect to homepage
          window.location.pathname = "/";
        } else {
          // Update UI to show user is signed in. result.payload contains the account that was logged in
        }
      });
  }

  ngOnDestroy(): void {
    this._destroying$.next(null);
    this._destroying$.complete();
  }
}
```

A full example can also be found in our [samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular12-sample-app/src/app/app.component.ts).

## The inProgress$ Observable

The `inProgress$` observable is also handled by the `MsalBroadcastService`, and should be subscribed to when application needs to know the status of interactions, particularly to check that interactions are completed. We recommend checking that the status of interactions is `InteractionStatus.None` before functions involving user accounts. 

Note that the last / most recent `InteractionStatus` will also be available when subscribing to the `inProgress$` observable.

See the example below for its use. A full example can also be found in our [samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular11-sample-app/src/app/home/home.component.ts#L23). A full list of interaction statuses can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/src/utils/BrowserConstants.ts#L87).

```js
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MsalBroadcastService} from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
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
        // Filtering for all interactions to be completed
        filter((status: InteractionStatus) => status === InteractionStatus.None),
        takeUntil(this._destroying$)
      )
      .subscribe(() => {
        // Do something related to user accounts or UI here
      })
  }

  ngOnDestroy(): void {
    this._destroying$.next(null);
    this._destroying$.complete();
  }
}

```

## Optional `MsalBroadcastService` Configurations

The `MsalBroadcastService` can be optionally configured to replay past events when subscribed to. By default, events that are emitted after the `MsalBroadcastService` is subscribed to are available. There may be instances where events prior to subscription are needed. By providing a configuration for the `MsalBroadcastService` and setting the `replayPastEvents` parameter to a number, that number of past events will be available upon subscription. 

For more information about replaying events, see the RxJS docs on ReplaySubjects [here](https://rxjs.dev/api/index/class/ReplaySubject).

The `MsalBroadcastService` can be configured in the app.module.ts file as follows:

```typescript
// app.module.ts
import { NgModule } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppComponent } from './app.component';
import { MsalModule, MsalService, MsalGuard, MsalInterceptor, MsalBroadcastService, MsalRedirectComponent, MSAL_BROADCAST_CONFIG } from "@azure/msal-angular"; // Import MsalBroadcastService and MSAL_BROADCAST_CONFIG here
import { PublicClientApplication, InteractionType, BrowserCacheLocation } from "@azure/msal-browser";

@NgModule({
    imports: [
        MsalModule.forRoot( new PublicClientApplication({ // MSAL Configuration
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
            },
            system: {
                loggerOptions: {
                    loggerCallback: () => {},
                    piiLoggingEnabled: false
                }
            }
        }), {
            interactionType: InteractionType.Popup, // MSAL Guard Configuration
            authRequest: {
              scopes: ['user.read']
            },
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
        {
          provide: MSAL_BROADCAST_CONFIG, // Add configuration to providers here
          useValue: {
            replayPastEvents: 2 // Set how many events you want to replay when subscribing
          }
        },
        MsalGuard,
        MsalBroadcastService // Ensure the MsalBroadcastService is provided
    ],
    bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule {}
```
