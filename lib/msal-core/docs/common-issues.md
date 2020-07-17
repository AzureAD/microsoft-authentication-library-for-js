# Common Issues and How to Solve Them

## General Notes about `acquireTokenSilent`

`acquireTokenSilent` uses a hidden iframe to execute token acquisition and renewal. It requires access to the users session cookies set by Azure AD and thus requires that the browser does not block third-party cookies. Currently Safari and Chrome Incognito browsers block these by default. When using these browsers `acquireTokenSilent` can only be used to retrieve valid tokens from local or session storage. If the token needs to be renewed your app will need to call `acquireTokenRedirect` or `acquireTokenPopup`. We recommend updating to the msal-browser library, which uses the Auth Code Flow, if you need to support these browsers.

In addition, `acquireTokenSilent` can fail for a number of reasons and we recommend that your app falls back to calling `acquireTokenRedirect` or `acquireTokenPopup` when an error occurs.

```javascript
msalObj.acquireTokenSilent(request).then((response) => {
    // Successfully accessed token
    }).catch((error) => {
        // Error occurred
        console.log(error);
        msalObj.acquireTokenPopup(request).then((response) => {
            // Successfully accessed token
            }).catch((error) => {
                console.log(error);
            });
    });
});
```

## X-Frame Options Deny

This error occurs when calling `acquireTokenSilent`, which opens a hidden iframe to execute the token renewal. In order to prevent click-jacking the service blocks auth pages from being displayed in the iframe. If you receive this error it means the service is trying to display something in the iframe such as an error or a page expecting user interaction, such as a form.

Some B2C flows are expected to throw this error due to their need for user interaction. These flows include:

- Password reset
- Profile edit
- Sign up
- Some custom policies depending on how they are configured

### Troubleshooting Steps

- Verify you are not using a flow that requires interaction
- Open the url shown in the error in a new window and observe what the service is trying to display

### Solutions

- When opening the url from the error in a new window, if an error is shown, address the error
- Call an interactive method such as `acquireTokenRedirect` or `acquireTokenPopup`
- Open a ticket with the service

### Known-Issues

A user has multiple accounts signed into their Social Provider (e.g. Google, Facebook, etc.). This happens because the login_hint is not being passed from the B2C service to the Social Provider to tell the Federated IDP which account you are trying to get a token for. If you open the error url in a new tab and see an account selection screen, this is likely what's happening. This is being actively investigated by the B2C Service team.

## Token Renewal Operation Failed due to timeout

This error occurs when calling `acquireTokenSilent`, which opens a hidden iframe to execute the token renewal. This can happen for a number of reasons, such as:

- Third party cookies are disabled (default for Safari and Chrome Incognito browsers)
- Another error occurred, such as X-Frame Options Deny, which prevented the token from being returned
- The page used as the `redirectUri` clears the hash or navigates away before the top frame can parse it

### Solutions

- If using a browser with third party cookies disabled you must call an interactive method such as `acquireTokenRedirect` or `acquireTokenPopup`
- Solve the accompanying error
- Set the `redirectUri` for the `acquireTokenSilent` call to a blank page

## Hash does not contain State

This error occurs when the hash in the url contains properties known to msal, such as `id_token`, but does not contain `state`. The `state` property is appended to token requests by msal and validated when the response is received. The most common cause of this error is that the request originated from an invite link that was not built by msal.

### Troubleshooting Steps

- Check your network trace for the /authorize request
- Verify `state` is included in the request
- Verify `state` is included in the response
- If `state` is not included in the request, verify the request was built by msal
- If `state` is included in the request, open a ticket with the service team to find out why it is not being returned in the response

### Solutions

- If using an invite link, send the user to your app running msal first and let msal build the token request. If additional query parameters are needed to complete the sign-up flow you can include them in `extraQueryParameters` on the request

## Silent request was sent but no user signed-in

This error occurs when calling `acquireTokenSilent` but the user's session could not be found by the service.

### Known Issues

- When using guest accounts, the e-mail used for sign-in may not match the e-mail used to store the account in AAD, causing the `login_hint` sent by msal as part of the request to not be correct. Configuring the `sid` claim on your `id_tokens` and passing this to your request may mitigate this issue.

### Solutions

- Ensure your app calls one of the login methods, `loginRedirect` or `loginPopup`, before attempting to call `acquireTokenSilent`
- Call an interactive method such as `acquireTokenRedirect` or `acquireTokenPopup`
- Configure your `id_tokens` to return the `sid` claim and pass this into your request 

```javascript
// id_token retrieved from previous login or acquireToken call
const request = {
    scopes: ["User.Read"],
    sid: id_token.sid
}
msalObj.acquireTokenSilent(request)
```

## Redirect Loops

Redirect loops occur most commonly when an app automatically triggers a `loginRedirect` call on page load. Your app should first verify a user is signed-in before attempting to login.

```javascript
if (!msalObj.getAccount()) {
    msalObj.loginRedirect(request);
} else {
    // User signed in!
}
```

### Solutions

- If using msal-angular and your app relies on the broadcast events, ensure your app calls `handleRedirectCallback()` on the page that handles the response containing the token.
- Set `navigateToLoginRequestUrl: false` in your msal config. When this is set to true, the IDP will redirect back to the configured `redirectUri` and then msal will additionally redirect to the page that initiated the login request. Setting this to false ensures navigation ends when the `redirectUri` is reached

```javascript
msal = new Msal.UserAgentApplication({
    auth: {
        clientId: your-client-id,
        redirectUri: your-redirect-uri
        navigateToLoginRequestUrl: false
    }
});
```

- Ensure your app is not clearing the response hash before msal can parse it. 
- Check your network trace for the response to the /authorize request. If it contains an `id_token` but your app is triggering another login, verify your app's logic
- If using IE11 or non-chromium Edge browsers set the `storeAuthStateInCookie: true` in your msal cache config

```javascript
msal = new Msal.UserAgentApplication({
    auth: {
        clientId: your-client-id,

    }
})
```