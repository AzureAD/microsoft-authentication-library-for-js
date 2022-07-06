# MSAL Angular v2 Errors

***

**[BrowserAuthErrors](#browserautherrors)**

1. [interaction_in_progress](#interaction_in_progress)

**[Additional Errors](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/errors.md)**

***

## BrowserAuthErrors

### Interaction_in_progress

**Error Message**: Interaction is currently in progress. Please ensure that this interaction has been completed before calling an interactive API.

This error is thrown when an interactive API (`loginPopup`, `loginRedirect`, `acquireTokenPopup`, `acquireTokenRedirect`) is invoked while another interactive API is still in progress. The login and acquireToken APIs are async so you will need to ensure that the resulting promises have resolved before invoking another one.

In `@azure/msal-angular` there are 2 common scenarios when this can happen:

1. Your application is not handling redirects correctly. The error then occurs when either the app or the user tries to call an interactive API. 
1. Your application is calling one of the above APIs without first checking if interaction is already in progress elsewhere.

Redirects **must** be handled either with the `MsalRedirectComponent` or with calling `handleRedirectObservable()`. Not handling redirects explicitly with either of these two approaches will result in the error above. See our docs on redirects [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/redirects.md) for more information on both approaches. 

Additionally, any interaction should be done after subscribing to the `inProgress$` observable and filtering for `InteractionStatus.None`. Attempting interaction while another is in progress is not supported and will result in the error above. Checking for `InteractionStatus.None` is how you ensure this does not happen. Please see our [events doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/events.md#the-inprogress-observable) for more details. 

Please see the [`@azure/msal-browser` error doc](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/errors.md) for more information on this error.

❌ The following example will throw this error when another component has already invoked an interactive API that is in progress:

```javascript
import { Component, OnInit } from '@angular/core';
import { MsalService, MsalBroadcastService, InteractionStatus } from '@azure/msal-angular';
import { filter } from 'rxjs/operators';

@Component()
export class ExampleComponent implements OnInit {

  constructor(
    private msalBroadcastService: MsalBroadcastService,
    private authService: MsalService
  ) {}

  ngOnInit(): void {
    this.authService.loginRedirect();
  }
```

✔️ To fix the previous example, check that no other interaction is in progress before invoking `loginRedirect`:

```javascript
import { Component, OnInit } from '@angular/core';
import { InteractionStatus } from '@azure/msal-browser';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { filter } from 'rxjs/operators';

@Component()
export class ExampleComponent implements OnInit {

  constructor(
    private msalBroadcastService: MsalBroadcastService,
    private authService: MsalService
  ) {}

  ngOnInit(): void {
    this.msalBroadcastService.inProgress$
      .pipe(
        filter((status: InteractionStatus) => status === InteractionStatus.None),
      )
      .subscribe(() => {
        this.authService.loginRedirect();
      })
  }
```

#### Troubleshooting Steps

- [Enable verbose logging](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md#using-the-config-object) and trace the order of events. Verify that an interactive API is not invoked before another has resolved. 
- If using the redirect flow make sure `MsalRedirectComponet` is correctly bootstrapped or `handleRedirectObservable` is being called on every page which may be redirected to.

If you are unable to figure out why this error is being thrown please [open an issue](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/new/choose) and be prepared to share the following information:

- Verbose logs
- A sample app and/or code snippets that we can use to reproduce the issue
- Refresh the page. Does the error go away?
- Open your application in a new tab. Does the error go away?
