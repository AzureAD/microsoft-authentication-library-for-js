exports.getHomePage = (req, res, next) => {
    const isAuthenticated = req.session.isAuthenticated;
    res.render('home', { isAuthenticated: isAuthenticated, isValidated: false });
}

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

    req.session.nonce = cryptoProvider.createNewGuid();

    const state = cryptoProvider.base64Encode(
        JSON.stringify({
            stage: 'sign_in',
            path: req.route.path,
            nonce: req.session.nonce
        })
    );

    const params = {
        authority: appSettings.appCredentials.authority,
        scopes: ["openid", "profile"],
        state: state,
        redirect: appSettings.settings.redirectUri,
    };

    // prepare the request
    req.session.authCodeRequest.authority = params.authority;
    req.session.authCodeRequest.scopes = params.scopes;
    req.session.authCodeRequest.state = params.state;
    req.session.authCodeRequest.redirectUri = params.redirect;

    req.session.tokenRequest.authority = params.authority;
    req.session.tokenRequest.redirectUri = params.redirect;
    req.session.tokenRequest.scopes = params.scopes;
    
    msalClient.getAuthCodeUrl(req.session.authCodeRequest).then((authCodeUrl) => {
        res.redirect(authCodeUrl);
    }).catch((error) => console.log(JSON.stringify(error)));
    };
};

exports.redirect = (msalClient, cryptoProvider) => {
    return (req, res, next) => {
        if (req.query.state) {
        const state = JSON.parse(cryptoProvider.base64Decode(req.query.state));
    
            // check if nonce matches
            if (state.nonce === req.session.nonce) {
    
                switch (state.stage) {
    
                    case 'sign_in': {
                        // token request should have auth code
                        req.session.tokenRequest.code = req.query.code;
        
                        try {
                            // exchange auth code for tokens
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
                        res.status(500).send('cannot determine app stage');
                        break;
                }
            } else {
                console.log('ELSE NONCE MISMATCH')
                res.status(401).send('not permitted');
            }
        } else {
            console.log('ELSE STATE NOT FOUND')
            res.status(401).send('not permitted');
        }
    }
}

exports.getToken = (resourceName, appSettings, msalClient) => {

    return async (req, res, next) => {
        const scopes = appSettings.protectedResources[resourceName].scopes;

        if (!req.session[resourceName]) {
            req.session[resourceName] = {
                accessToken: null,
            };
        }

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

            const tokenResponse = await msalClient.acquireTokenSilent(silentRequest);
            // console.log("\nSuccessful silent token acquisition:\n Response: \n:", tokenResponse);

            req.session.protectedResources[resourceName].accessToken = tokenResponse.accessToken;
            next();

        } catch (error) {
        console.log("ERROR INSIDE GET TOKEN");
        next(error);
        }
    };
};

exports.signOut = (appSettings) => {

    return (req, res, next) => {
        /**
         * Construct a logout URI and redirect the user to end the 
         * session with Azure AD/B2C. For more information, visit: 
         * (AAD) https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc#send-a-sign-out-request
         * (B2C) https://docs.microsoft.com/azure/active-directory-b2c/openid-connect#send-a-sign-out-request
         */
        const logoutURI = `${appSettings.appCredentials.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${appSettings.settings.postLogoutRedirectUri}`;

        req.session.isAuthenticated = false;

        req.session.destroy(() => {
            res.redirect(logoutURI);
        });
    }
};
