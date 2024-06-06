# Silent login with ssoSilent()

If you already have a session that exists with the authentication server, you can use the `ssoSilent()` API to make a request for tokens without interaction.

## With User Hint

If you already have the user's sign-in information, you can pass this into the API to improve performance and ensure that the authorization server will look for the correct account session. You can pass one of the following into the request object in order to successfully obtain a token silently.

- `account` (which can be retrieved using on of the [account APIs](./accounts.md))
- `sid` (which can be retrieved from the `idTokenClaims` of an `account` object)
- `login_hint` (which can be retrieved from the account object `username` property or the `upn` claim in the ID token)

Passing an account will look for sid in the token claims, then fall back to loginHint (if provided) or account username.

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

## Without User Hint

If there is not enough information available about the user, you can attempt to use the `ssoSilent` API **without** passing an `account`, `sid` or `login_hint`.

```javascript
const silentRequest = {
    scopes: ["User.Read", "Mail.Read"]
};
```

However, be aware that if your application has code paths for multiple users in a single browser session, or if the user has multiple accounts for that single browser session, then there is a higher likelihood of silent sign-in errors. You may see the following error show up in the event of multiple account sessions found by the authorization server:

```txt
InteractionRequiredAuthError: interaction_required: AADSTS16000: Either multiple user identities are available for the current request or selected account is not supported for the scenario.
```

This indicates that the server could not determine which account to sign into, and will require either one of the parameters above (`account`, `login_hint`, `sid`) or an interactive sign-in to choose the account.

## Handling Failures

If ssoSilent() fails, we recommend handling this error by logging in interactively. Here is an example of ssoSilent() being used in an application's `app.component.ts`:

```js
import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { SilentRequest, SsoSilentRequest } from '@azure/msal-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(
    private authService: MsalService,
  ) {}

  ngOnInit(): void {
    const silentRequest: SsoSilentRequest = {
      scopes: ["User.Read"],
      loginHint: "user@contoso.com"
    }

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
}

```
