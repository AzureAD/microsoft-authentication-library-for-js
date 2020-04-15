# Acquiring and Using an Access Token

Before you start here, make sure you understand how to [initialize the application object](./initialization.md).

In MSAL, you can get access tokens for the APIs your app needs to call using the acquireToken methods provided by the library which make requests to Azure AD to obtain an `authorization code`. The MSAL library then exchanges that code for an [`access token`](https://docs.microsoft.com/azure/active-directory/develop/access-tokens) containing the user consented scopes to allow your app to securely call the API.

You can read more about access tokens [here](https://docs.microsoft.com/azure/active-directory/develop/access-tokens).

## Choosing an Interaction Type

See [here](./initialization.md#choosing-an-interaction-type) if you are uncertain about the differences between `acquireTokenRedirect` and `acquireTokenPopup`.

## Acquiring an Access Token

MSAL uses a cache to store tokens based on specific parameters including scopes, resource and authority, and will retrieve the token from the cache when needed. It also can perform silent renewal of those tokens when they have expired. MSAL exposes this functionality through the `acquireTokenSilent` method.

It is best practice to attempt an `acquireTokenSilent` call before using the interactive APIs. This allows you to prevent unnecessary user interactions. 
`acquireTokenSilent` will look for a valid token in the cache, and if it is close to expiring or does not exist, will automatically try to refresh it for you.

If the `acquireTokenSilent` call fails, you need to initiate an interactive request. This could happen for many reasons including scopes that have been revoked, expired tokens, or password changes.

You can read more about using `acquireTokenSilent` [here](./token-lifetimes.md).

You must pass a request object to the acquireToken APIs. This object allows you to use different parameters in the request. See [here](./request-response-object.md) for more information on the request object parameters. Scopes are required for all acquireToken calls.

- Popup
```javascript
var request = {
    scopes: ["Mail.Read"]
};

const tokenResponse = await msalInstance.acquireTokenSilent(request).catch(async (error) => {
    // fallback to interaction when silent call fails
    return await myMSALObj.acquireTokenPopup(request).catch(error => {
        console.log(error);
    });
});
```

- Redirect
```javascript
var request = {
    scopes: ["Mail.Read"]
};

const tokenResponse = await msalInstance.acquireTokenSilent(request).catch(error => {
    console.log("silent token acquisition fails. acquiring token using redirect");
    // fallback to interaction when silent call fails
    return myMSALObj.acquireTokenRedirect(request)
});
```

## Using the Access Token

Once you have retrieved the access token, you must include it in the `Authorization` header as a bearer token for the request to the resource you obtained the token for, as shown below:

```JavaScript
var headers = new Headers();
var bearer = "Bearer " + tokenResponse.accessToken;
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

# Next Steps

Learn about [token lifetimes, expiration and renewal](./token-lifetimes.md).
