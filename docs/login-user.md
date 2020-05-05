# Login User

Before you start here, make sure you understand how to [initialize the application object](./initialization.md).

The login APIs in MSAL retrieve an `authorization code` which can be exchanged for an [`id token`](https://docs.microsoft.com/azure/active-directory/develop/id-tokens) for a signed in user, while consenting scopes for an additional resource. If your application does not use `id tokens`, please see [here](./acquire-token.md) for information on how to acquire `access tokens` without an `id token`.

You can read more about `id tokens` on our [Azure Docs pages](https://docs.microsoft.com/azure/active-directory/develop/id-tokens).

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
    msalInstance.loginRedirect({});
} catch (err) {
    // handle error
}
```

When a login call has succeeded, you can use the `getAccount()` function to retrieve the user information.
```javascript
const myAccount = msalInstance.getAccount();
```

## Silent login with ssoSilent()

If you already have a session that exists with the authentication server, you can use the ssoSilent() API to make request for tokens without interaction. You will need to pass a `login_hint` (usually the user's `upn`) in the request object in order to successfully obtain a token silently.

```javascript
const silentRequest = {
    scopes: ["User.Read", "Mail.Read"],
    loginHint: "user@contoso.com"
};

try {
    const loginResponse = await msalInstance.ssoSilent(silentRequest);
} catch (err) {
    // handle error
}
```

# Next Steps

Learn how to [acquire and use an access token](./acquire-token.md)!
