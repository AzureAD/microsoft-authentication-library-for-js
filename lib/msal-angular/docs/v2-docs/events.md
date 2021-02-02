# Events in MSAL Angular v2

Before you start here, make sure you understand how to [initialize the application object](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/initialization.md).

MSAL Angular v2 uses the event system exposed by `@azure/msal-browser`, which emits events related to auth and MSAL, and can be used for updating UI, showing error messages, and so on.

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
      .subscribe((result) => {
        // Do something with the result
      });
  }

  ngOnDestroy(): void {
    this._destroying$.next(null);
    this._destroying$.complete();
  }
}
```


For the full example of using events, please see our sample [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/angular10-sample-app/src/app/app.component.ts#L29).

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

## The inProgress$ Observable

The `inProgress$` observable is also handled by the `MsalBroadcastService`, and should be subscribed to when application needs to know the status of interactions, particularly to check that interactions are completed. We recommend checking that the status of interactions is none before functions involving user accounts.

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
