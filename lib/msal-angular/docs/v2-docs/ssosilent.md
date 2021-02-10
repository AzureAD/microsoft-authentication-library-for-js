# Silent login with ssoSilent()

If you already have a session that exists with the authentication server, you can use the `ssoSilent()` API to make a request for tokens without interaction.

You will need to pass a `loginHint` in the request object in order to successfully obtain a token silently. The `loginHint` can be retrieved from the account object `username` property or the `upn` claim in the ID token, and can also be retrieved from the `emails` claim for B2C use cases. Alternatively, `sid` can be passed instead of `loginHint` for AAD use cases.

Make to wait until pending interaction has completed before invoking `ssoSilent`, and to check whether or not there is a cache account. 

```js
const silentRequest: SsoSilentRequest = {
    scopes: ["User.Read", "Mail.Read"],
    loginHint: "user@contoso.com"
};

this.authService.ssoSilent(silentRequest)
    .subscribe({
        next: (result) => console.log("Success!"), // Handle result
        error: (error) => console.log(error) // Handle error
    });
```

If ssoSilent() fails, we recommend handling this error by logging in interactively. Here is an example of ssoSilent() being used in an application's `app.component.ts`:

```js
import { Component, OnInit } from '@angular/core';
import { MsalService, MsalBroadcastService } from '@azure/msal-angular';
import { SilentRequest, SsoSilentRequest, InteractionStatus, AuthenticationResult } from '@azure/msal-browser';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
    private readonly _destroying$ = new Subject<void>();

    constructor(
        private authService: MsalService,
        private msalBroadcastService: MsalBroadcastService
    ) {}

    ngOnInit(): void {
        const silentRequest: SsoSilentRequest = {
            scopes: ["User.Read"],
            loginHint: "user@contoso.com"
        }

        // Wait until pending interaction is complete
        this.msalBroadcastService.inProgress$
            .pipe(
                filter((status: InteractionStatus) => status === InteractionStatus.None),
                takeUntil(this._destroying$)
            )
            .subscribe(() => {
                // Check current accounts
                if (this.authService.instance.getAllAccounts().length < 1) {
                    this.authService.ssoSilent(silentRequest)
                        .subscribe({
                            next: (result: AuthenticationResult) => {
                                console.log("SsoSilent succeeded!"); // Handle result
                            },
                            error: (error) => {
                                this.authService.loginRedirect(); // Handle error by logging in interactively
                            }
                        });
                }
            });
    }

    ngOnDestroy(): void {
        this._destroying$.next(undefined);
        this._destroying$.complete();
    }
}
```
