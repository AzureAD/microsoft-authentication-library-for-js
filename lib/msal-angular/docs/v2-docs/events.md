# Events in MSAL Angular v2

Before you start here, make sure you understand how to [initialize the application object](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msal-angular-v2/lib/msal-angular/docs/v2-docs/initialization.md).

MSAL Angular v2 uses the event system exposed by `@azure/msal-browser`, which emits events related to auth and MSAL, and can be used for updating UI, showing error messages, and so on.

## Consuming events in your app

Events in `@azure/msal-angular` are managed by the `MsalBroadcastService`, and are available by subscribing to the `msalSubject$` observable on the `MsalBroadcastService`. 

Here is an example of how you can consume the emitted events in your application:
```javascript
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


For the full example of using events, please see the sample [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/msal-angular-v2/samples/msal-angular-v2-samples/angular10-sample-app/src/app/app.component.ts#L29).

## Table of events

For more information about the `EventMessage` object, including the full table of events currently emitted by `@azure/msal-browser` (including descriptions and related payloads), please see the documentation [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/events.md).
