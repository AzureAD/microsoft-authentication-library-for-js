# MSAL Node Standalone Sample: Authorization Code Grant (Silent) on Azure AD B2C

This sample demonstrates a [public client application](../../../lib/msal-node/docs/initialize-public-client-application.md) registered on Azure AD B2C. It uses:

1. [OIDC Connect protocol](https://docs.microsoft.com/azure/active-directory-b2c/openid-connect) to implement standard B2C [user-flows](https://docs.microsoft.com/azure/active-directory-b2c/user-flow-overview) to:

- sign-up/sign-in a user (with password reset/recovery)

2. [authorization code grant](https://docs.microsoft.com/azure/active-directory-b2c/authorization-code-flow) to acquire an [Access Token](https://docs.microsoft.com/azure/active-directory-b2c/tokens-overview) to call a [protected web API](https://docs.microsoft.com/azure/active-directory-b2c/add-web-api-application?tabs=app-reg-ga) (also on Azure AD B2C)

## Registration

This sample comes with a registered application for demo purposes. If you would like to use your own **Azure AD B2C** tenant and application, follow the steps below:

1. [Create an Azure Active Directory B2C tenant](https://docs.microsoft.com/azure/active-directory-b2c/tutorial-create-tenant)
2. [Register a web application in Azure Active Directory B2C](https://docs.microsoft.com/azure/active-directory-b2c/tutorial-register-applications?tabs=app-reg-ga)
3. [Create user flows in Azure Active Directory B2C](https://docs.microsoft.com/azure/active-directory-b2c/tutorial-create-user-flows)

## Configuration

In `policies.js`, we create a `b2cPolicies` object to store authority strings for initiating each user-flow:

```javascript
const b2cPolicies = {
    authorities: {
        signUpSignIn: {
            authority: "https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/B2C_1_susi",
        },
    },
    authorityDomain: "fabrikamb2c.b2clogin.com"
}
```

In `index.js`, we setup the configuration object expected by MSAL Node `publicClientApplication` class constructor:

```javascript
const publicClientConfig = {
    auth: {
        clientId: "e6e1bea3-d98f-4850-ba28-e80ed613cc72",
        authority: policies.authorities.signUpSignIn.authority, //signUpSignIn policy is our default authority
        knownAuthorities: [policies.authorityDomain], // mark your tenant's custom domain as a trusted authority
        redirectUri: "http://localhost:3000/redirect",
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};
```

MSAL enables PKCE in the Authorization Code Grant Flow by including the `codeChallenge` and `codeChallengeMethod` parameters in the request passed into `getAuthCodeUrl()` API, as well as the `codeVerifier` parameter in the second leg (`acquireTokenByCode()` API).

Generating the `codeVerifier` and the `codeChallenge` is the client application's responsibility. For this sample, you can either implement your own PKCE code generation logic or use an existing tool to manually generate a **Code Verifier** and **Code Challenge**, plugging them into the `pkceCodes` object below.

For details on implementing your own PKCE code generation logic, consult the PKCE specification `https://tools.ietf.org/html/rfc7636#section-4`

```javascript
const PKCE_CODES = {
    CHALLENGE_METHOD: "S256", // Use SHA256 Algorithm
    VERIFIER: "", // Generate a code verifier for the Auth Code Request first
    CHALLENGE: "" // Generate a code challenge from the previously generated code verifier
};
```

Implementing B2C user-flows is a matter of initiating authorization requests against the corresponding authorities. This sample demonstrates the [sign-up/sign-in](https://docs.microsoft.com/azure/active-directory-b2c/add-sign-up-and-sign-in-policy?pivots=b2c-user-flow) user-flow with [self-service password reset](https://docs.microsoft.com/azure/active-directory-b2c/add-password-reset-policy?pivots=b2c-user-flow#self-service-password-reset-recommended).

In order to keep track of these *flows*, we create some global objects and manipulate these in the rest of the application.

> :warning: In a real-world scenario, these objects will be specific to each request or user. As such, you might want to store them in a **session** variable.

```javascript
const APP_STATES = {
    SIGN_IN: "sign_in",
    CALL_API: "call_api",
}

const authCodeRequest = {
    codeChallenge: PKCE_CODES.CHALLENGE, // PKCE Code Challenge
    codeChallengeMethod: PKCE_CODES.CHALLENGE_METHOD // PKCE Code Challenge Method
};

const tokenRequest = {
    codeVerifier: PKCE_CODES.VERIFIER // PKCE Code Verifier
};
```

## Usage

### Initialize MSAL Node

```javascript
const pca = new msal.PublicClientApplication(publicClientConfig);
```

### Sign-in a user

Setup an Express route for initiating the sign-in flow:

```javascript
app.get("/login", (req, res) => {
    getAuthCode(policies.authorities.signUpSignIn.authority, [], APP_STATES.SIGN_IN, res);
})
```

### Get an authorization code

Create a helper method to prepare request parameters that will be passed to MSAL Node's `getAuthCodeUrl()` method, which triggers the first leg of auth code flow.

```javascript
const getAuthCode = (authority, scopes, state, req, res) => {

    // prepare the request
    authCodeRequest.authority = authority;
    authCodeRequest.scopes = scopes;
    authCodeRequest.state = state;

    tokenRequest.authority = authority;

    // Initialize CryptoProvider instance
    const cryptoProvider = new msal.CryptoProvider();
    // Generate PKCE Codes before starting the authorization flow
    cryptoProvider.generatePkceCodes().then(({ verifier, challenge }) => {
        // create session object if does not exist
        if (!req.session.pkceCodes) {
            req.session.pkceCodes = {
                challengeMethod: 'S256'
            };
        }

        // Set generated PKCE Codes as session vars
        req.session.pkceCodes.verifier = verifier;
        req.session.pkceCodes.challenge = challenge;

        // Add PKCE code challenge and challenge method to authCodeUrl request object
        authCodeRequest.codeChallenge = req.session.pkceCodes.challenge;
        authCodeRequest.codeChallengeMethod = req.session.pkceCodes.challengeMethod;

        // Get url to sign user in and consent to scopes needed for application
        return pca.getAuthCodeUrl(authCodeRequest).then((response) => {
            res.redirect(response);
        })
        .catch((error) => {
            res.status(500).send(error);
        });
    });
}
```

### Handle redirect response

The second leg of the auth code flow consists of handling the redirect response from the B2C server. We do this in the `/redirect` route, responding appropriately to the `state` parameter in the query string.

> Learn more about the state parameter in requests [here](https://docs.microsoft.com/azure/active-directory-b2c/authorization-code-flow#1-get-an-authorization-code)

```javascript
// Second leg of auth code grant
app.get("/redirect", (req, res) => {

    // determine where the request comes from
    if (req.query.state === APP_STATES.SIGN_IN) {

        // prepare the request for authentication
        tokenRequest.scopes = [];
        tokenRequest.code = req.query.code;

        pca.acquireTokenByCode(tokenRequest)
            .then((response) => {
                const templateParams = { showLoginButton: false, username: response.account.username, profile: false };
                res.render("api", templateParams);
            }).catch((error) => {
                res.status(500).send(error);
            });

    } else if (req.query.state === APP_STATES.CALL_API) {

        // prepare the request for calling the web API
        tokenRequest.authority = policies.authorities.signUpSignIn.authority;
        tokenRequest.scopes = apiConfig.webApiScopes;
        tokenRequest.code = req.query.code;

        pca.acquireTokenByCode(tokenRequest)
            .then((response) => {

                // store access token somewhere
                req.session.accessToken = response.accessToken;

                // call the web API
                api.callWebApi(apiConfig.webApiUri, response.accessToken, (response) => {
                    const templateParams = { showLoginButton: false, profile: JSON.stringify(response, null, 4) };
                    res.render("api", templateParams);
                });

            }).catch((error) => {
                console.log(error);
                res.status(500).send(error);
            });

    } else {
        res.status(500).send("Unknown");
    }
});
```

### Acquire an access token

In this sample, we've setup a token cache. We can try to silently acquire an access token from the cache by passing the signed-in user's account.
To do this, simply pass the `homeAccountId` to MSAL's `getAccountByHomeId()` API, create a `silentRequest` object, then initiate the `acquireTokenSilent()` API.

```javascript
// Initiates auth code grant for web API call
app.get("/api", async (req, res) => {
    const msalTokenCache = pca.getTokenCache();
    // Find Account by Local Account Id
    account = await msalTokenCache.getAccountByHomeId(req.session.homeAccountId);

    // build silent request
    const silentRequest = {
        account: account,
        scopes: apiConfig.webApiScopes
    };

    // acquire Token Silently to be used in when calling web API
    pca.acquireTokenSilent(silentRequest)
        .then((response) => {
            // do something with the response
        })
        .catch((error) => {
            // catch **interaction_required** errors here and handle them by initiating a new token request
        });
});
```
