# Request

Since MSAL Node supports various authorization code grants, there is support for different public APIs per grant and the corresponding request.

## Authorization Code Flow

### Public APIs
- [getAuthCodeUrl()](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_publicclientapplication_.publicclientapplication.html#getauthcodeurl): This API is the first leg of the `authorization code grant` for MSAL Node. The request is of the type [AuthorizationUrlRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_authorizationurlrequest_.html).
The application is sent a URL that can be used to generate an `authorization code` by any browser of choice, and then proceed to call the below API for the `token acquisition` .

- [acquireTokenByCode()](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-node/classes/_src_client_publicclientapplication_.publicclientapplication.html#acquiretokenbycode): This API is the second leg of the `authorization code grant` for MSAL Node. The request constructed here should be of the type [AuthorizationCodeRequest](https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-common/modules/_src_request_authorizationcoderequest_.html). The application passed the `authorization code` received as a part of the above step and exchanges it for a `token`.

``` javascript

    const authCodeUrlParameters = {
        scopes: ["user.read"],
        redirectUri: ["http://localhost:3000/redirect"],
    };

    // get url to sign user in and consent to scopes needed for application
    pca.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
        console.log(response);
    }).catch((error) => console.log(JSON.stringify(error)));

    const tokenRequest = {
        code: req.query.code,
        redirectUri: "http://localhost:3000/redirect",
        scopes: ["user.read"],
    };

    // acquire a token by exchanging the code
    pca.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("\nResponse: \n:", response);
    }).catch((error) => {
        console.log(error);
    });
```

