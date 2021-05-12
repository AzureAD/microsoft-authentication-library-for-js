# MSAL Node standalone samples

The sample applications contained in this directory are independent samples of MSAL Node usage, covering each of the authorization flows that MSAL Node currently supports. To get started with this sample, first follow the general instructions [here](../readme.md).

Once MSAL Node is installed, and you have the right files, come here to learn about this scenario.

## Web app using auth code flow on Azure AD B2C

This sample demonstrates a [confidential client application](https://docs.microsoft.com/azure/active-directory-b2c/application-types#web-applications) registered on Azure AD B2C. It features:

1. using [OIDC Connect protocol](https://docs.microsoft.com/azure/active-directory-b2c/openid-connect) to implement standard B2C [user-flows](https://docs.microsoft.com/azure/active-directory-b2c/user-flow-overview) to:

- sign-up/sign-in a user
- reset/recover a user password
- edit a user profile

2. using [authorization code grant](https://docs.microsoft.com/azure/active-directory-b2c/authorization-code-flow) to acquire an [Access Token](https://docs.microsoft.com/azure/active-directory-b2c/tokens-overview) to call a [protected web API](https://docs.microsoft.com/azure/active-directory-b2c/add-web-api-application?tabs=app-reg-ga) (also on Azure AD B2C)

### Registration

This sample comes with a pre-registered application for demo purposes. If you would like to use your own **Azure AD B2C** tenant and application, follow the steps below:

1. [Create an Azure Active Directory B2C tenant](https://docs.microsoft.com/azure/active-directory-b2c/tutorial-create-tenant)
2. [Register a web application in Azure Active Directory B2C](https://docs.microsoft.com/azure/active-directory-b2c/tutorial-register-applications?tabs=app-reg-ga)
3. [Create user flows in Azure Active Directory B2C](https://docs.microsoft.com/azure/active-directory-b2c/tutorial-create-user-flows)

### Configuration

In `policies.js`, we create a `b2cPolicies` object to store authority strings for initiating each user-flow:

```javascript
const b2cPolicies = {
    authorities: {
        signUpSignIn: {
            authority: "https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/B2C_1_susi",
        },
        resetPassword: {
            authority: "https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/B2C_1_reset",
        },
        editProfile: {
            authority: "https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/B2C_1_edit_profile"
        }
    },
    authorityDomain: "fabrikamb2c.b2clogin.com"
}
```

In `index.js`, we setup the configuration object expected by MSAL Node `confidentialClientApplication` class constructor:

```javascript
const confidentialClientConfig = {
    auth: {
        clientId: "e6e1bea3-d98f-4850-ba28-e80ed613cc72",
        authority: policies.authorities.signUpSignIn.authority, //signUpSignIn policy is our default authority
        clientSecret: "CLIENT_SECRET",
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

Implementing B2C user-flows is a matter of initiating token requests against the corresponding authorities. Some user-flows are slightly more complex. For example, to initiate the **password-reset**, the user first needs to click on the **forgot my password** link on the Azure sign-in screen, which causes B2C service to respond with an error. We then catch this error, and trigger another sign-in, this time against the `https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/B2C_1_reset` authority.

> :information_source: This sample demonstrates the legacy password-reset user-flow. There's now a [new password reset experience](https://docs.microsoft.com/azure/active-directory-b2c/add-password-reset-policy?pivots=b2c-user-flow#self-service-password-reset-recommended) that is part of the sign-up or sign-in policy. As such, you don't need a separate policy for password reset anymore. See the [b2c-auth-code-pkce](../b2c-auth-code-pkce/README.md) sample for how this works.

In order to keep track of these *flows*, we create some global objects and manipulate these in the rest of the application.

> :warning: In a real-world scenario, these objects will be specific to each request or user. As such, you might want to store them in a **session** variable.

```javascript
const APP_STATES = {
    SIGN_IN: "sign_in",
    CALL_API: "call_api",
    PASSWORD_RESET: "password_reset",
}

const authCodeRequest = {
};

const tokenRequest = {
};
```

### Usage

#### Initialize MSAL Node

```javascript
const cca = new msal.ConfidentialClientApplication(confidentialClientConfig);
```

#### Sign-in a user

Setup an Express route for initiating the sign-in flow:

```javascript
app.get("/signin", (req, res) => {
    if (authCodeRequest.state === APP_STATES.PASSWORD_RESET) {
        // if coming for password reset, set the authority to password reset
        getAuthCode(policies.authorities.resetPassword.authority, SCOPES.oidc, APP_STATES.PASSWORD_RESET, res);
    } else {
        // else, login as usual with the default authority
        getAuthCode(policies.authorities.signUpSignIn.authority, SCOPES.oidc, APP_STATES.SIGN_IN, res);
    }
})
```

#### Get an authorization code

Create a helper method to prepare request parameters that will be passed to MSAL Node's `getAuthCodeUrl()` method, which triggers the first leg of auth code flow.

```javascript
const getAuthCode = (authority, scopes, state, res) => {

    // prepare the request
    authCodeRequest.authority = authority;
    authCodeRequest.scopes = scopes;
    authCodeRequest.state = state;

    tokenRequest.authority = authority;

    // request an authorization code to exchange for a token
    return cca.getAuthCodeUrl(authCodeRequest)
        .then((response) => {
            res.redirect(response);
        })
        .catch((error) => {
            res.status(500).send(error);
        });
}
```

#### Handle redirect response

The second leg of the auth code flow consists of handling the redirect response from the B2C server. We do this in the `/redirect` route, responding appropriately to the `state` parameter in the query string.

> Learn more about the state parameter in requests [here](https://docs.microsoft.com/azure/active-directory-b2c/authorization-code-flow#1-get-an-authorization-code)

```javascript
// Second leg of auth code grant
app.get("/redirect", (req, res) => {

    // determine where the request comes from
    if (req.query.state === APP_STATES.SIGN_IN) {

        // prepare the request for authentication
        tokenRequest.scopes = SCOPES.oidc;
        tokenRequest.code = req.query.code;

        cca.acquireTokenByCode(tokenRequest)
            .then((response) => {
                const templateParams = { showLoginButton: false, username: response.account.username, profile: false };
                res.render("api", templateParams);
            }).catch((error) => {
                if (req.query.error) {

                    /**
                     * When the user selects "forgot my password" on the sign-in page, B2C service will throw an error.
                     * We are to catch this error and redirect the user to login again with the resetPassword authority.
                     * For more information, visit: https://docs.microsoft.com/azure/active-directory-b2c/user-flow-overview#linking-user-flows
                     */
                    if (JSON.stringify(req.query.error_description).includes("AADB2C90118")) {
                        authCodeRequest.authority = policies.authorities.resetPassword;
                        authCodeRequest.state = APP_STATES.PASSWORD_RESET;
                        return res.redirect('/login');
                    }
                }
                res.status(500).send(error);
            });

    } else if (req.query.state === APP_STATES.CALL_API) {

        // prepare the request for calling the web API
        tokenRequest.authority = policies.authorities.signUpSignIn.authority;
        tokenRequest.scopes = SCOPES.resource1;
        tokenRequest.code = req.query.code;

        cca.acquireTokenByCode(tokenRequest)
            .then((response) => {

                // store access token somewhere
                app.locals.accessToken = response.accessToken;

                // call the web API
                api.callWebApi(apiConfig.webApiUri, response.accessToken, (response) => {
                    const templateParams = { showLoginButton: false, profile: JSON.stringify(response, null, 4) };
                    res.render("api", templateParams);
                });

            }).catch((error) => {
                console.log(error);
                res.status(500).send(error);
            });

    } else if (req.query.state === APP_STATES.PASSWORD_RESET) {

        // once the password is reset, redirect the user to login again with the new password
        authCodeRequest.state = APP_STATES.SIGN_IN;
        res.redirect('/login');
    } else {
        res.status(500).send("Unknown");
    }
});
```

#### Acquire an access token

Check if there is a stored access token in memory; if not, initiate the first leg of auth code flow to request an access token. Otherwise, call the web API.

```javascript
app.get("/api", async (req, res) => {
    // If no accessToken in store, request authorization code to exchange for a token
    if (!app.locals.accessToken) {
        getAuthCode(policies.authorities.signUpSignIn.authority, SCOPES.resource1, APP_STATES.CALL_API, res);
    } else {
        // else, call the web API
        api.callWebApi(apiConfig.webApiUri, app.locals.accessToken, (response) => {
            const templateParams = { showLoginButton: false, profile: JSON.stringify(response, null, 4) };
            res.render("api", templateParams);
        });
    }
});
```

> :warning: silent flows are not used with the this scenario. See [this sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/standalone-samples/b2c-silent-flow) for how to setup a silent token request in MSAL Node
