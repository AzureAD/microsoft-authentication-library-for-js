# Acquire and Renew a Token to Call an API

In MSAL, you can get access tokens for the APIs your app needs to call using the `acquireTokenSilent` method which makes a silent request(without prompting the user with UI) to Azure AD to obtain an access token. The Azure AD service then returns an [access token](https://docs.microsoft.com/en-us/azure/active-directory/develop/access-tokens) containing the user consented scopes to allow your app to securely call the API.

You can use `acquireTokenRedirect` or `acquireTokenPopup` to initiate interactive requests, although, it is best practice to only show interactive experiences if you are unable to obtain a token silently due to interaction required errors. If you are using an interactive token call, it must match the login method used in your application. (`loginPopup`=> `acquireTokenPopup`, `loginRedirect` => `acquireTokenRedirect`).

If the `acquireTokenSilent` call fails with an error of type `InteractionRequiredAuthError` you will need to initiate an interactive request.  This could happen for many reasons including scopes that have been revoked, expired tokens, or password changes.

`acquireTokenSilent` will look for a valid token in the cache, and if it is close to expiring or does not exist, will automatically try to refresh it for you.

```JavaScript
    // if the user is already logged in you can acquire a token
    if (msalInstance.getAccount()) {
        var tokenRequest = {
            scopes: ["user.read", "mail.send"]
        };
        msalInstance.acquireTokenSilent(tokenRequest)
            .then(response => {
                // get access token from response
                // response.accessToken
            })
            .catch(err => {
                // could also check if err instance of InteractionRequiredAuthError if you can import the class.
                if (err.name === "InteractionRequiredAuthError") {
                    return msalInstance.acquireTokenPopup(tokenRequest)
                        .then(response => {
                            // get access token from response
                            // response.accessToken
                        })
                        .catch(err => {
                            // handle error
                        });
                }
            });
    } else {
        // user is not logged in, you will need to log them in to acquire a token
    }
```

## Signing in and getting tokens with MSAL.js

MSAL.js 1.x provides a **request object** with a clean interface and typed parameters to help you create authentication requests with the required settings. Now you can pass one parameter- the request object, to the login and acquireToken calls.

Additionally, the request object also surfaces optional attributes (that were previously nested under extraQueryParameters) needed in certain advanced scenarios, such as prompt.

```javascript
    // Request type
    export type AuthenticationParameters = {
        scopes?: Array<string>;
        extraScopesToConsent?: Array<string>;
        prompt?: string;
        extraQueryParameters?: StringDict;
        claimsRequest?: string;
        authority?: string;
        state?: string;
        correlationId?: string;
        account?: Account;
        sid?: string;
        loginHint?: string;
        forceRefresh?: boolean;
        redirectUri?: string;
    };
```

To make it easier to handle application flow outcomes in code, we have introduced a **response object** in MSAL.js 1.0.0. It encapsulates the tokens returned in the success callbacks of login and acquireToken methods as well as aggregated consented scopes and additional useful attributes of the token such as token expiration, authenticated account, etc. Below are the **response attributes** available in the response object:

```javascript
export type AuthResponse = {
    uniqueId: string;
    tenantId: string;
    tokenType: string;
    idToken: IdToken;
    idTokenClaims: StringDict;
    accessToken: string;
    scopes: Array<string>;
    expiresOn: Date;
    account: Account;
    accountState: string;
    fromCache: boolean
};
```

## Example usage:

```javascript
let loginRequest = {
    scopes: ["user.read", "user.write"],
    prompt: "select_account",
}

let accessTokenRequest = {
    scopes: ["user.read", "user.write"]
}

myMSALObj.loginPopup(loginRequest).then(function (loginResponse) {
    return myMSALObj.acquireTokenSilent(accessTokenRequest);
}).then(function (accessTokenResponse) {
    const token = accessTokenResponse.accessToken;
}).catch(function (error) {  
    // handle error
});
```

## Using forceRefresh to skip cache
If you would like to skip a cached token and go to the server, please pass in the boolean `forceRefresh` into the `AuthenticationParameters` object used to make a login / token request. **WARNING:** This should not be used by default, because of the performance impact on your application.  Relying on the cache will give your users a better experience, and skipping it should only be used in scenarios where you know the current cached data does not have up to date information.  Example: Admin tool to add roles to a user that needs to get a new token with updates roles.
