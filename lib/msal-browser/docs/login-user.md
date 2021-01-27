# Login User

Before you start here, make sure you understand how to [initialize the application object](./initialization.md).

The login APIs in MSAL retrieve an `authorization code` which can be exchanged for an [ID token](https://docs.microsoft.com/azure/active-directory/develop/id-tokens) for a signed in user, while consenting scopes for an additional resource, and an [access token](https://docs.microsoft.com/azure/active-directory/develop/access-tokens) containing the user consented scopes to allow your app to securely call the API.

You can read more about ID tokens on our [Azure Docs pages](https://docs.microsoft.com/azure/active-directory/develop/id-tokens).

## Choosing an Interaction Type

See [here](./initialization.md#choosing-an-interaction-type) if you are uncertain about the differences between `loginRedirect` and `loginPopup`.

## Login the user

You must pass a request object to the login APIs. This object allows you to use different parameters in the request. See [here](./request-response-object.md) for more information on the request object parameters. 

For login requests, all parameters are optional, so you can just send an empty object.

- Popup
```javascript
try {
    const loginResponse = await msalInstance.loginPopup({});
} catch (err) {
    // handle error
}
```

- Redirect
```javascript
try {
    msalInstance.loginRedirect({});
} catch (err) {
    // handle error
}
```

Or you can send a set of [scopes](./request-response-object.md#scopes) to pre-consent to:
- Popup
```javascript
var loginRequest = {
    scopes: ["user.read", "mail.send"] // optional Array<string>
};

try {
    const loginResponse = await msalInstance.loginPopup(loginRequest);
} catch (err) {
    // handle error
}
```

- Redirect
```javascript
var loginRequest = {
    scopes: ["user.read", "mail.send"] // optional Array<string>
};

try {
    msalInstance.loginRedirect(loginRequest);
} catch (err) {
    // handle error
}
```

## Account APIs

When a login call has succeeded, you can use the `getAllAccounts()` function to retrieve information about currently signed in users.
```javascript
const myAccounts: AccountInfo[] = msalInstance.getAllAccounts();
```

If you know the account information, you can also retrieve the account information by using the `getAccountByUsername()` or `getAccountByHomeId()` APIs:
```javascript
const username = "test@contoso.com";
const myAccount: AccountInfo = msalInstance.getAccountByUsername(username);

const homeAccountId = "userid.hometenantid"; // Best to retrieve the homeAccountId from an account object previously obtained through msal
const myAccount: AccountInfo = maslInstance.getAccountByHomeId(homeAccountId);
```

**Note:** `getAccountByUsername()` is provided for convenience and should be considered less reliable than `getAccountByHomeId()`. When possible use `getAccountByHomeId()`.

In B2C scenarios your B2C tenant will need to be configured to return the `emails` claim on `idTokens` in order to use the `getAccountByUsername()` API.

These APIs will return an account object or an array of account objects with the following signature:
```javascript
{
    // home account identifier for this account object
    homeAccountId: string;
    // Entity who issued the token represented as a full host of it (e.g. login.microsoftonline.com)
    environment: string;
    // Full tenant or organizational id that this account belongs to
    tenantId: string;
    // preferred_username claim of the id_token that represents this account.
    username: string;
};
```

## Silent login with ssoSilent()

If you already have a session that exists with the authentication server, you can use the ssoSilent() API to make request for tokens without interaction. You will need to pass a `login_hint` (which can be retrieved from the account object `username` property or the `upn` claim in the ID token) in the request object in order to successfully obtain a token silently.

```javascript
const silentRequest = {
    scopes: ["User.Read", "Mail.Read"],
    loginHint: "user@contoso.com"
};

try {
    const loginResponse = await msalInstance.ssoSilent(silentRequest);
} catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
        const loginResponse = await msalInstance.loginPopup(silentRequest).catch(error => {
            // handle error
        });
    } else {
        // handle error
    }
}
```

# Next Steps

Learn how to [acquire and use an access token](./acquire-token.md)!
