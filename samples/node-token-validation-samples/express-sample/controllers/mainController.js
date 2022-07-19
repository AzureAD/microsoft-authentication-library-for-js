/**
 * Function to get home page
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
exports.getHomePage = (req, res, next) => {
    const isAuthenticated = req.session.isAuthenticated;
    res.render('home', { isAuthenticated: isAuthenticated, isValidated: false });
}

/**
 * Initiate sign in flow
 * @param {*} msalClient 
 * @param {*} cryptoProvider 
 * @param {*} appSettings 
 * @returns 
 */
exports.signIn = (msalClient, cryptoProvider, appSettings) => {

    return (req, res, next) => {
        /**
         * Request Configuration
         * We manipulate these two request objects below
         * to acquire a token with the appropriate claims
         */
        if (!req.session["authCodeRequest"]) {
            req.session.authCodeRequest = {
            authority: "",
            scopes: [],
            state: {},
            redirectUri: "",
            };
        }
    
        if (!req.session["tokenRequest"]) {
            req.session.tokenRequest = {
            authority: "",
            scopes: [],
            redirectUri: "",
            code: "",
            };
        }

        // Random GUID for csrf check
        req.session.nonce = cryptoProvider.createNewGuid();

        /**
         * The OAuth 2.0 state parameter can be used to encode information of the app's state before redirect. 
         * You can pass the user's state in the app, such as the page or view they were on, as input to this parameter. 
         * MSAL allows you to pass your custom state as state parameter in the request object. For more information, visit:
         * https://docs.microsoft.com/azure/active-directory/develop/msal-js-pass-custom-state-authentication-request
         */
        const state = cryptoProvider.base64Encode(
            JSON.stringify({
                stage: 'sign_in',
                path: req.route.path,
                nonce: req.session.nonce
            })
        );

        // Auth code parameters
        const params = {
            authority: appSettings.appCredentials.authority,
            scopes: ["openid", "profile"],
            state: state,
            redirect: appSettings.settings.redirectUri,
        };

        // Initiate the first leg of the auth code grant to get token
        this.getAuthCode(req, res, next, msalClient, params);
    };
};

/**
 * Util method used to generate an auth code request
 * @param {*} msalClient 
 * @param {*} params 
 * @returns 
 */
exports.getAuthCode = (req, res, next, msalClient, params) => {

    // Prepare the request
    req.session.authCodeRequest.authority = params.authority;
    req.session.authCodeRequest.scopes = params.scopes;
    req.session.authCodeRequest.state = params.state;
    req.session.authCodeRequest.redirectUri = params.redirect;

    req.session.tokenRequest.authority = params.authority;
    req.session.tokenRequest.redirectUri = params.redirect;
    req.session.tokenRequest.scopes = params.scopes;
    
    // Request an authorization code to exchange for tokens
    msalClient.getAuthCodeUrl(req.session.authCodeRequest).then((authCodeUrl) => {
        res.redirect(authCodeUrl);
    }).catch((error) => console.log(JSON.stringify(error)));
}

/**
 * Middleware that handles redirect
 * @param {*} msalClient 
 * @param {*} cryptoProvider 
 * @returns 
 */
exports.redirect = (msalClient, cryptoProvider) => {
    return (req, res, next) => {
        if (req.query.state) {
            const state = JSON.parse(cryptoProvider.base64Decode(req.query.state));
    
            // Check if nonce matches
            if (state.nonce === req.session.nonce) {
    
                switch (state.stage) {
    
                    case 'sign_in': {
                        // Token request should have auth code
                        req.session.tokenRequest.code = req.query.code;
        
                        try {
                            // Exchange auth code for tokens
                            msalClient.acquireTokenByCode(req.session.tokenRequest)
                                .then((response) => {
                                    req.session.account = response.account;
                                    req.session.isAuthenticated = true;
                                    res.status(200).redirect('/home');
                                })
                                .catch(e => {
                                    console.log(e);
                                })
    
                        } catch (error) {
                            console.log(error);
                            next(error);
                        }
                        break;
                    }
    
                    default:
                        res.status(500).send('Cannot determine app stage');
                        break;
                }
            } else {
                console.log('Nonce mismatch');
                res.status(401).send('Not permitted');
            }
        } else {
            console.log('State not found');
            res.status(401).send('Not permitted');
        }
    }
}

/**
 * Middleware that gets tokens and calls 
 * @param {*} resourceName 
 * @param {*} appSettings 
 * @param {*} msalClient 
 * @returns 
 */
exports.getToken = (resourceName, appSettings, msalClient, cryptoProvider) => {

    return async (req, res, next) => {
        // Get scopes for token request
        const scopes = appSettings.protectedResources[resourceName].scopes;

        // Sets protectedResources in session
        if (!req.session.protectedResources) {
            req.session.protectedResources = {};
        }

        req.session.protectedResources[resourceName] = {
            ...appSettings.protectedResources[resourceName],
            accessToken: null,
        };

        try {
            const tokenCache = await msalClient.getTokenCache();
            const account = await tokenCache.getAccountByHomeId(req.session.account.homeAccountId);

            const silentRequest = {
                account: account,
                scopes: scopes,
            };

            // Acquire token silently to be used in resource call
            const tokenResponse = await msalClient.acquireTokenSilent(silentRequest);
            console.log("Successful silent token acquisition");

            req.session.protectedResources[resourceName].accessToken = tokenResponse.accessToken;
            next();

        } catch (error) {
            // In case there are no cached tokens, initiate an interactive call
            if (error.errorCode === "no_tokens_found") {

                const state = cryptoProvider.base64Encode(
                    JSON.stringify({
                        stage: constants.AppStages.ACQUIRE_TOKEN,
                        path: req.route.path,
                        nonce: req.session.nonce
                    })
                );

                const params = {
                    authority: appSettings.appCredentials.authority,
                    scopes: scopes,
                    state: state,
                    redirect: appSettings.settings.redirectUri,
                    account: req.session.account,
                };

                // Initiate the first leg of auth code grant to get token
                this.getAuthCode(req, res, next, msalClient, params);
            } else {
                next(error);
            }
        }
    };
};

/**
 * Initiate sign out and clean the session
 * @param {*} appSettings 
 * @returns 
 */
exports.signOut = (appSettings) => {

    return (req, res, next) => {
        /**
         * Construct a logout URI and redirect the user to end the 
         * session with Azure AD. For more information, visit: 
         * (AAD) https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc#send-a-sign-out-request
         */
        const logoutURI = `${appSettings.appCredentials.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${appSettings.settings.postLogoutRedirectUri}`;

        req.session.isAuthenticated = false;

        req.session.destroy(() => {
            res.redirect(logoutURI);
        });
    }
};
