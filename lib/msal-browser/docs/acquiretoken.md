
#### 4. Get an access token to call an API

In MSAL, you can get access tokens for the APIs your app needs to call using the `acquireTokenSilent` method which makes a silent request(without prompting the user with UI) to Azure AD to obtain an access token. The Azure AD service then returns an [access token](https://docs.microsoft.com/azure/active-directory/develop/access-tokens) containing the user consented scopes to allow your app to securely call the API.

You can use `acquireTokenRedirect` or `acquireTokenPopup` to initiate interactive requests, although, it is best practice to only show interactive experiences if you are unable to obtain a token silently due to interaction required errors. If you are using an interactive token call, it must match the login method used in your application. (`loginPopup`=> `acquireTokenPopup`, `loginRedirect` => `acquireTokenRedirect`).

If the `acquireTokenSilent` call fails, you may need to initiate an interactive request. This could happen for many reasons including scopes that have been revoked, expired tokens, or password changes.

`acquireTokenSilent` will look for a valid token in the cache, and if it is close to expiring or does not exist, will automatically try to refresh it for you.

See [Request and Response Data Types]() for reference.

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
                // handle error
            });
    } else {
        // user is not logged in, you will need to log them in to acquire a token
    }
```

#### 5. Use the token as a bearer in an HTTP request to call the Microsoft Graph or a Web API

```JavaScript
    var headers = new Headers();
    var bearer = "Bearer " + token;
    headers.append("Authorization", bearer);
    var options = {
         method: "GET",
         headers: headers
    };
    var graphEndpoint = "https://graph.microsoft.com/v1.0/me";

    fetch(graphEndpoint, options)
        .then(resp => {
             //do something with response
        });
```
