# MSAL Node Standalone Sample: Authorization Code Grant on Azure AD B2C

This sample demonstrates a [confidential client application](../../../lib/msal-node/docs/initialize-confidential-client-application.md) registered on Azure AD B2C. It uses:

1. [OIDC Connect protocol](https://docs.microsoft.com/azure/active-directory-b2c/openid-connect) to implement standard B2C [user-flows](https://docs.microsoft.com/azure/active-directory-b2c/user-flow-overview) for:

-   sign-up/sign-in a user
-   reset/recover a user password
-   edit a user profile

2. [Authorization code grant](https://docs.microsoft.com/azure/active-directory-b2c/authorization-code-flow) to acquire an [Access Token](https://docs.microsoft.com/azure/active-directory-b2c/tokens-overview) to call a [protected web API](https://docs.microsoft.com/azure/active-directory-b2c/add-web-api-application?tabs=app-reg-ga) (also on Azure AD B2C).

## Registration

1. [Create an Azure Active Directory B2C tenant](https://docs.microsoft.com/azure/active-directory-b2c/tutorial-create-tenant)
2. [Register a web application in Azure Active Directory B2C](https://docs.microsoft.com/azure/active-directory-b2c/tutorial-register-applications?tabs=app-reg-ga)
3. [Create user flows in Azure Active Directory B2C](https://docs.microsoft.com/azure/active-directory-b2c/tutorial-create-user-flows)

## Configuration

In `customConfig.json`, we create a `policies` object to store authority strings for initiating each user-flow. The object may look like the following:

```json
    "policies": {
        "authorities": {
            "signUpSignIn": {
                "authority": "https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/B2C_1_susi"
            },
            "resetPassword": {
                "authority": "https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/B2C_1_reset"
            },
            "editProfile": {
                "authority": "https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/B2C_1_edit_profile"
            }
        },
        "authorityDomain": "fabrikamb2c.b2clogin.com"
    },
```

An exception is the client secret, which must be stored in an `.env` file instead of the configuration.

**.env file**

```
CLIENT_SECRET=<your client secret here>
```

In `index.js`, we setup the configuration object expected by MSAL Node `confidentialClientApplication` class constructor:

**index.js**

```javascript
const confidentialClientConfig = {
    auth: {
        clientId: config.authOptions.clientId,
        authority: config.policies.authorities.signUpSignIn.authority,
        clientSecret: process.env.CLIENT_SECRET,
        knownAuthorities: [config.policies.authorityDomain],
    },
};

// Create an MSAL PublicClientApplication object
const confidentialClientApp = new msal.ConfidentialClientApplication(
    confidentialClientConfig
);
```

Implementing B2C user-flows is a matter of initiating authorization requests against the corresponding authorities. Some user-flows are slightly more complex. For example, to initiate the **password-reset**, the user first needs to click on the **forgot my password** link on the Azure sign-in screen, which causes B2C service to respond with an error. We then catch this error, and trigger another authorization request, this time against the `https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/B2C_1_reset` authority.

> :information_source: This sample demonstrates the legacy password-reset user-flow. There's now a [new password reset experience](https://docs.microsoft.com/azure/active-directory-b2c/add-password-reset-policy?pivots=b2c-user-flow#self-service-password-reset-recommended) that is part of the sign-up or sign-in policy. As such, you don't need a separate policy for password reset anymore.

In order to keep track of these _flows_, we create request objects, attach them to the session variable and manipulate them in the rest of the application.

```javascript
const APP_STAGES = {
    SIGN_IN: "sign_in",
    PASSWORD_RESET: "password_reset",
    EDIT_PROFILE: "edit_profile",
    ACQUIRE_TOKEN: "acquire_token",
};
```

## Usage

### Initialize MSAL Node

```javascript
const cca = new msal.ConfidentialClientApplication(confidentialClientConfig);
```

### Sign-in a user

Setup an Express route for initiating the sign-in flow:

```javascript
app.get("/sign-in", (req, res, next) => {
    // create a GUID against crsf
    req.session.csrfToken = cryptoProvider.createNewGuid();

    /**
     * The MSAL Node library allows you to pass your custom state as state parameter in the Request object.
     * The state parameter can also be used to encode information of the app's state before redirect.
     * You can pass the user's state in the app, such as the page or view they were on, as input to this parameter.
     */
    const state = cryptoProvider.base64Encode(
        JSON.stringify({
            csrfToken: req.session.csrfToken,
            appStage: APP_STAGES.SIGN_IN,
        })
    );

    const authCodeUrlRequestParams = {
        authority: scenarioConfig.policies.authorities.signUpSignIn.authority,
        state: state,
    };

    const authCodeRequestParams = {};

    return redirectToAuthCodeUrl(
        req,
        res,
        next,
        authCodeUrlRequestParams,
        authCodeRequestParams
    );
});
```

### Get an authorization code URL

Create a helper method to prepare request parameters that will be passed to MSAL Node's `getAuthCodeUrl` API, which triggers the first leg of auth code flow.

```javascript
const redirectToAuthCodeUrl = async (
    req,
    res,
    next,
    authCodeUrlRequestParams,
    authCodeRequestParams
) => {
    // Generate PKCE Codes before starting the authorization flow
    const { verifier, challenge } = await cryptoProvider.generatePkceCodes();

    // Set generated PKCE codes and method as session vars
    req.session.pkceCodes = {
        challengeMethod: "S256",
        verifier: verifier,
        challenge: challenge,
    };

    /**
     * By manipulating the request objects below before each request, we can obtain
     * auth artifacts with desired claims. For more information, visit:
     * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationurlrequest
     * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#authorizationcoderequest
     **/

    req.session.authCodeUrlRequest = {
        redirectUri: REDIRECT_URI,
        codeChallenge: req.session.pkceCodes.challenge,
        codeChallengeMethod: req.session.pkceCodes.challengeMethod,
        responseMode: "form_post", // recommended for confidential clients
        ...authCodeUrlRequestParams,
    };

    req.session.authCodeRequest = {
        redirectUri: REDIRECT_URI,
        code: "",
        ...authCodeRequestParams,
    };

    // Get url to sign user in and consent to scopes needed for application
    try {
        const authCodeUrlResponse = await clientApplication.getAuthCodeUrl(
            req.session.authCodeUrlRequest
        );
        res.redirect(authCodeUrlResponse);
    } catch (error) {
        next(error);
    }
};
```

### Handle redirect response

The second leg of the auth code flow consists of handling the redirect response from the B2C server. We do this in the `/redirect` route, responding appropriately to the `state` parameter in the request body.

> Learn more about the state parameter[here](https://docs.microsoft.com/azure/active-directory-b2c/authorization-code-flow#1-get-an-authorization-code)

```javascript
// Second leg of auth code grant
app.post("/redirect", async (req, res, next) => {
    if (!req.body.state) {
        return next(new Error("State not found"));
    }

    // read the state object and determine the stage of the flow
    const state = JSON.parse(cryptoProvider.base64Decode(req.body.state));

    if (state.csrfToken === req.session.csrfToken) {
        switch (state.appStage) {
            case APP_STAGES.SIGN_IN:
                req.session.authCodeRequest.code = req.body.code; // authZ code
                req.session.authCodeRequest.codeVerifier =
                    req.session.pkceCodes.verifier; // PKCE Code Verifier

                try {
                    const tokenResponse =
                        await clientApplication.acquireTokenByCode(
                            req.session.authCodeRequest
                        );
                    req.session.account = tokenResponse.account;
                    req.session.isAuthenticated = true;
                    res.redirect("/");
                } catch (error) {
                    if (req.body.error) {
                        /**
                         * When the user selects 'forgot my password' on the sign-in page, B2C service will throw an error.
                         * We are to catch this error and redirect the user to LOGIN again with the resetPassword authority.
                         * For more information, visit: https://docs.microsoft.com/azure/active-directory-b2c/user-flow-overview#linking-user-flows
                         */
                        if (
                            JSON.stringify(req.body.error_description).includes(
                                "AADB2C90118"
                            )
                        ) {
                            // create a GUID against crsf
                            req.session.csrfToken =
                                cryptoProvider.createNewGuid();

                            const state = cryptoProvider.base64Encode(
                                JSON.stringify({
                                    csrfToken: req.session.csrfToken,
                                    appStage: APP_STAGES.PASSWORD_RESET,
                                })
                            );

                            const authCodeUrlRequestParams = {
                                authority:
                                    scenarioConfig.policies.authorities
                                        .resetPassword.authority,
                                state: state,
                            };

                            const authCodeRequestParams = {};

                            // if coming for password reset, set the authority to password reset
                            return redirectToAuthCodeUrl(
                                req,
                                res,
                                next,
                                authCodeUrlRequestParams,
                                authCodeRequestParams
                            );
                        }
                    }
                    next(error);
                }

                break;
            case APP_STAGES.ACQUIRE_TOKEN:
                req.session.authCodeRequest.code = req.body.code; // authZ code
                req.session.authCodeRequest.codeVerifier =
                    req.session.pkceCodes.verifier; // PKCE Code Verifier

                try {
                    const tokenResponse =
                        await clientApplication.acquireTokenByCode(
                            req.session.authCodeRequest
                        );
                    req.session.accessToken = tokenResponse.accessToken;
                    res.redirect("/call-api");
                } catch (error) {
                    next(error);
                }

                break;
            case APP_STAGES.PASSWORD_RESET:
            case APP_STAGES.EDIT_PROFILE:
                // redirect the user to sign-in again
                res.redirect("/sign-in");
                break;
            default:
                next(new Error("cannot determine app stage"));
        }
    } else {
        next(new Error("crsf token mismatch"));
    }
});
```

### Acquire an access token

The `getToken` method below first checks if there is a non-expired access token in the cache for this user via msal-node's `acquireTokenSilent` API; if the access token is expired but the refresh token is not, it exchanges the refresh token for a new access token. If the refresh token is expired as well, it initiates the first leg of authorization code flow to request a new access token from Azure AD B2C:

```javascript
const getToken = async (req, res, next, scopes) => {
    try {
        const tokenCache = clientApplication.getTokenCache();
        const account = await tokenCache.getAccountByHomeId(
            req.session.account.homeAccountId
        );

        const silentRequest = {
            account: account,
            scopes: scopes,
        };

        // acquire token silently to be used in resource call
        const tokenResponse = await clientApplication.acquireTokenSilent(
            silentRequest
        );
        return tokenResponse;
    } catch (error) {
        if (error instanceof msal.InteractionRequiredAuthError) {
            req.session.csrfToken = cryptoProvider.createNewGuid();

            state = cryptoProvider.base64Encode(
                JSON.stringify({
                    csrfToken: req.session.csrfToken,
                    appStage: APP_STAGES.ACQUIRE_TOKEN,
                })
            );

            const authCodeUrlRequestParams = {
                authority:
                    scenarioConfig.policies.authorities.signUpSignIn.authority,
                state: state,
            };

            const authCodeRequestParams = {
                scopes: scopes,
            };

            return redirectToAuthCodeUrl(
                req,
                res,
                next,
                authCodeUrlRequestParams,
                authCodeRequestParams
            );
        }

        next(error);
    }
};
```
