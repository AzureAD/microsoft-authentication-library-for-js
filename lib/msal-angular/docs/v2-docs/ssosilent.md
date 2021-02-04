# Silent login with ssoSilent()

If you already have a session that exists with the authentication server, you can use the ssoSilent() API to make request for tokens without interaction. You will need to pass a `loginHint` (which can be retrieved from the account object `username` property or the `upn` claim in the ID token) in the request object in order to successfully obtain a token silently.

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
