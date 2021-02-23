# Performance

## How to configure `msal-angular` to use your router's navigate function for client-side navigation

By default, when MSAL.js needs to navigate from one page in your application to another it will reassign `window.location`, causing a full frame redirect to the other page and causing your application to re-render. If you're using the Angular Router this may be undesireable since the Router enables "client-side" navigation and shows or hides only the parts of the page as necessary.

Currently there is one scenario where MSAL.js will navigate from one page in your application to another. If your application is doing **all** of the following things, continue reading:

- Your application is using the redirect flow, instead of the popup flow, to login
- `PublicClientApplication` is configured with `auth.navigateToLoginRequestUrl: true` (default)
- Your application has pages that may call `loginRedirect`/`acquireTokenRedirect` with a shared `redirectUri` i.e. You call `loginRedirect` from `http://localhost/protected` with a redirectUri of `http://localhost`

If your application is doing all of the things above you can override the method MSAL uses to navigate by creating a class that extends `NavigationClient` and calling `setNavigationClient`.

### Example Implementation

The example below will show how to implement this when using the Angular `Router`. More information on the Angular Router can be found [here](https://angular.io/guide/router), and you can find a full sample apps that implement this for [Angular here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples).

#### Extending NavigationClient

```javascript
import { NavigationClient, NavigationOptions } from "@azure/msal-browser";
import { Router } from "@angular/router"

export class CustomNavigationClient extends NavigationClient {
    private router: Router;

    constructor(router: Router) {
        super();
        this.router = router;
    }

    async navigateInternal(url:string, options: NavigationOptions): Promise<boolean> {
        this.router.navigateByUrl(url);
        return Promise.resolve(false);
    }
}
```

#### Setting the NavigationClient in the app.component.ts

```javascript
import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MsalService, MsalBroadcastService, MSAL_GUARD_CONFIG, MsalGuardConfiguration } from '@azure/msal-angular';

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
    private router: Router
  ) {
    const customNavigationClient = new CustomNavigationClient(this.router);
    this.authService.instance.setNavigationClient(customNavigationClient);
  }

  ngOnInit(): void {
    // Additional code
  }
}

```
