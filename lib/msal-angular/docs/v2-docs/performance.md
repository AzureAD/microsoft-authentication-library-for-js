# Performance

## How to configure `@azure/msal-angular` to use your router's navigate function for client-side navigation

By default, when MSAL.js needs to navigate from one page in your application to another it will reassign `window.location`, causing a full frame redirect to the other page and causing your application to re-render. If you're using the Angular Router this may be undesireable since the Router enables "client-side" navigation and shows or hides only the parts of the page as necessary.

Currently there is one scenario where MSAL.js will navigate from one page in your application to another. If your application is doing **all** of the following things, continue reading:

- Your application is using the redirect flow, instead of the popup flow, to login
- `PublicClientApplication` is configured with `auth.navigateToLoginRequestUrl: true` (default)
- Your application has pages that may call `loginRedirect`/`acquireTokenRedirect` with a shared `redirectUri` i.e. You call `loginRedirect` from `http://localhost/protected` with a redirectUri of `http://localhost`

If your application is doing all of the things above you can override the method MSAL uses to navigate by importing the `MsalCustomNavigationClient` and calling `setNavigationClient`.

**NOTE**: Due to a security fix, the `MsalCustomNavigationClient` will not be using the Angular `Router` to navigate client-side when `navigateToLoginRequestUrl` is set to true and handling redirects. This is a known issue that will be addressed in a future release.

### Example Implementation

The example below will show how to implement this when using the Angular `Router`. More information on the Angular Router can be found [here](https://angular.io/guide/router), and you can find a full sample app that implements this for [Angular here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular10-sample-app).

```javascript
import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration, MsalCustomNavigationClient } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {

  constructor(
    @Inject(MSAL_GUARD_CONFIG) private msalGuardConfig: MsalGuardConfiguration,
    private authService: MsalService,
    private msalBroadcastService: MsalBroadcastService,
    private router: Router,
    private location: Location
  ) {
    const customNavigationClient = new MsalCustomNavigationClient(this.authService, this.router, this.location);
    this.authService.instance.setNavigationClient(customNavigationClient);
  }

  ngOnInit(): void {
    // Additional code
  }
}

```
