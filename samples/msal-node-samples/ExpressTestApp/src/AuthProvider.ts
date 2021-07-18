/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    InteractionRequiredAuthError
} from '@azure/msal-common';

import {
    ConfidentialClientApplication,
    Configuration,
    AccountInfo,
    ICachePlugin,
    CryptoProvider,
} from '@azure/msal-node';

import { ConfigurationUtils } from './ConfigurationUtils';
import { TokenValidator } from './TokenValidator';

import {
    AppSettings,
    Resource,
} from './Types';

import {
    ErrorMessages,
} from './Errors';

import * as constants from './Constants';

/**
 * A simple wrapper around MSAL Node ConfidentialClientApplication object.
 * It offers a collection of middleware and utility methods that automate 
 * basic authentication and authorization tasks in Express MVC web apps. 
 * 
 * You must have express and express-sessions packages installed. Middleware here 
 * can be used with express sessions in route controllers.
 * 
 * Session variables accessible are as follows:
    * req.session.isAuthenticated => boolean
    * req.session.isAuthorized => boolean
    * req.session.idTokenClaims => object
    * req.session.homeAccountId => string
    * req.session.account => object
    * req.session.resourceName.accessToken => string
 */
export class AuthProvider {

    appSettings: AppSettings;
    msalConfig: Configuration;
    cryptoProvider: CryptoProvider;
    tokenValidator: TokenValidator;
    msalClient: ConfidentialClientApplication;

    /**
     * @param {JSON} appSettings 
     * @param {Object} cache: cachePlugin
     */
    constructor(appSettings: AppSettings, cache: ICachePlugin = null) {
        ConfigurationUtils.validateAppSettings(appSettings);

        this.cryptoProvider = new CryptoProvider();

        this.appSettings = appSettings;
        this.msalConfig = ConfigurationUtils.getMsalConfiguration(appSettings, cache);
        this.tokenValidator = new TokenValidator(this.appSettings, this.msalConfig);
        this.msalClient = new ConfidentialClientApplication(this.msalConfig);
    }

    // ========== MIDDLEWARE ===========

    /**
     * Initiate sign in flow
     * @param {Object} req: express request object
     * @param {Object} res: express response object
     */
    signIn = async (req, res): Promise<any> => {

        /** 
         * Request Configuration
         * We manipulate these three request objects below 
         * to acquire a token with the appropriate claims
         */

        if (!req.session['authCodeRequest']) {
            req.session.authCodeRequest = {
                authority: "",
                scopes: [],
                state: {},
                redirectUri: ""
            };
        }

        if (!req.session['tokenRequest']) {
            req.session.tokenRequest = {
                authority: "",
                scopes: [],
                state: {},
                redirectUri: ""
            };
        }

        // current account id
        req.session.homeAccountId = "";

        // random GUID for csrf check 
        req.session.nonce = this.cryptoProvider.createNewGuid();

        // sign-in as usual
        const state = this.cryptoProvider.base64Encode(
                JSON.stringify({
                    stage: constants.AppStages.SIGN_IN,
                    path: req.route.path,
                    nonce: req.session.nonce
                })
            );

        // get url to sign user in (and consent to scopes needed for application)
        this.getAuthCode(
            this.msalConfig.auth.authority,
            Object.values(constants.OIDCScopes),
            state,
            this.appSettings.settings.redirectUri,
            req,
            res
        );
    };

    /**
     * Initiate sign out and clean the session
     * @param {Object} req: express request object
     * @param {Object} res: express response object
     * @param {Function} next: express next 
     */
    signOut = async (req, res): Promise<any> => {

        /**
         * Construct a logout URI and redirect the user to end the 
         * session with Azure AD/B2C. For more information, visit: 
         * (AAD) https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc#send-a-sign-out-request
         * (B2C) https://docs.microsoft.com/azure/active-directory-b2c/openid-connect#send-a-sign-out-request
         */
        const logoutURI = `${this.msalConfig.auth.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${this.appSettings.settings.postLogoutRedirectUri}`;

        req.session.isAuthenticated = false;

        req.session.destroy(() => {
            res.redirect(logoutURI);
        });
    }

    /**
     * Middleware that handles redirect depending on request state
     * There are basically 2 stages: sign-in and acquire token
     * @param {Object} req: express request object
     * @param {Object} res: express response object
     */
    handleRedirect = async (req, res): Promise<any> => {

        const state = JSON.parse(this.cryptoProvider.base64Decode(req.query.state));

        // check if nonce matches
        if (state.nonce === req.session.nonce) {

            switch (state.stage) {

                case constants.AppStages.SIGN_IN: {
                    // token request should have auth code
                    const tokenRequest = {
                        redirectUri: this.appSettings.settings.redirectUri,
                        scopes: Object.keys(constants.OIDCScopes),
                        code: req.query.code,
                    };

                    try {
                        // exchange auth code for tokens
                        const tokenResponse = await this.msalClient.acquireTokenByCode(tokenRequest)
                        console.log("\nResponse: \n:", tokenResponse);

                        if (this.tokenValidator.validateIdToken(tokenResponse.idTokenClaims)) {

                            req.session.homeAccountId = tokenResponse.account.homeAccountId;

                            // assign session variables
                            req.session.idTokenClaims = tokenResponse.idTokenClaims;
                            req.session.isAuthenticated = true;

                            return res.status(200).redirect(this.appSettings.settings.homePageRoute);
                        } else {
                            console.log(ErrorMessages.INVALID_TOKEN);
                            return res.status(401).send(ErrorMessages.NOT_PERMITTED);
                        }
                    } catch (error) {
                        console.log(error);
                        res.status(500).send(error);
                    }
                    break;
                }

                case constants.AppStages.ACQUIRE_TOKEN: {
                    // get the name of the resource associated with scope
                    const resourceName = this.getResourceName(state.path);

                    const tokenRequest = {
                        code: req.query.code,
                        scopes: this.appSettings.resources[resourceName].scopes, // scopes for resourceName
                        redirectUri: this.appSettings.settings.redirectUri,
                    };

                    try {
                        const tokenResponse = await this.msalClient.acquireTokenByCode(tokenRequest);
                        console.log("\nResponse: \n:", tokenResponse);

                        req.session[resourceName].accessToken = tokenResponse.accessToken;
                        return res.status(200).redirect(state.path);

                    } catch (error) {
                        console.log(error);
                        res.status(500).send(error);
                    }
                    break;
                }

                default:
                    res.status(500).send(ErrorMessages.CANNOT_DETERMINE_APP_STAGE);
                    break;
            }
        } else {
            console.log(ErrorMessages.NONCE_MISMATCH)
            res.status(401).send(ErrorMessages.NOT_PERMITTED);
        }
    };

    /**
     * Middleware that gets tokens and calls web APIs
     * @param {Object} req: express request object
     * @param {Object} res: express response object
     * @param {Function} next: express next 
     */
    getToken = async (req, res, next): Promise<any> => {

        // get scopes for token request
        const scopes = (<Resource>Object.values(this.appSettings.resources)
            .find((resource: Resource) => resource.callingPageRoute === req.route.path)).scopes;

        const resourceName = this.getResourceName(req.route.path);

        if (!req.session[resourceName]) {
            req.session[resourceName] = {
                accessToken: null,
                resourceResponse: null,
            };
        }

        try {

            let account: AccountInfo;

            try {
                account = await this.msalClient.getTokenCache().getAccountByHomeId(req.session.homeAccountId);

                if (!account) {
                    throw new Error(ErrorMessages.INTERACTION_REQUIRED);
                }

            } catch (error) {
                console.log(error);
                throw new InteractionRequiredAuthError(ErrorMessages.INTERACTION_REQUIRED);
            }

            const silentRequest = {
                account: account,
                scopes: scopes,
            };

            // acquire token silently to be used in resource call
            const tokenResponse = await this.msalClient.acquireTokenSilent(silentRequest)
            console.log("\nSuccessful silent token acquisition:\n Response: \n:", tokenResponse);

            // In B2C scenarios, sometimes an access token is returned empty.
            // In that case, we will acquire token interactively instead.
            if (tokenResponse.accessToken.length === 0) {
                console.log(ErrorMessages.TOKEN_NOT_FOUND);
                throw new InteractionRequiredAuthError(ErrorMessages.INTERACTION_REQUIRED);
            }

            req.session[resourceName].accessToken = tokenResponse.accessToken;
            return next();

        } catch (error) {
            // in case there are no cached tokens, initiate an interactive call
            if (error instanceof InteractionRequiredAuthError) {

                const state = this.cryptoProvider.base64Encode(
                    JSON.stringify({
                        stage: constants.AppStages.ACQUIRE_TOKEN,
                        path: req.route.path,
                        nonce: req.session.nonce
                    })
                );

                // initiate the first leg of auth code grant to get token
                this.getAuthCode(
                    this.msalConfig.auth.authority,
                    scopes,
                    state,
                    this.appSettings.settings.redirectUri,
                    req,
                    res
                );
            }
        }
    }

    // ============== GUARD ===============

    /**
     * Check if authenticated in session
     * @param {Object} req: express request object
     * @param {Object} res: express response object
     * @param {Function} next: express next 
     */
    isAuthenticated = (req, res, next): Promise<any> => {
        if (req.session) {
            if (!req.session.isAuthenticated) {
                return res.status(401).send(ErrorMessages.NOT_PERMITTED);
            }
            next();
        } else {
            return res.status(401).send(ErrorMessages.NOT_PERMITTED);
        }
    }

    /**
     * Receives access token in req authorization header
     * and validates it using the jwt.verify
     * @param {Object} req: express request object
     * @param {Object} res: express response object
     * @param {Function} next: express next 
     */
    isAuthorized = async (req, res, next): Promise<any> => {

        const accessToken = req.headers.authorization.split(' ')[1];

        if (req.headers.authorization) {
            if (!(await this.tokenValidator.validateAccessToken(accessToken, req.route.path))) {
                return res.status(401).send(ErrorMessages.NOT_PERMITTED);
            }

            next();
        } else {
            res.status(401).send(ErrorMessages.NOT_PERMITTED);
        }
    }

    // ============== UTILS ===============

    /**
     * This method is used to generate an auth code request
     * @param {string} authority: the authority to request the auth code from 
     * @param {Array} scopes: scopes to request the auth code for 
     * @param {string} state: state of the application
     * @param {string} redirect: redirect URI
     * @param {Object} req: express request object
     * @param {Object} res: express response object
     */
    private getAuthCode = async (authority: string, scopes: string[], state: string, redirect: string, req, res): Promise<any> => {

        // prepare the request
        req.session.authCodeRequest.authority = authority;
        req.session.authCodeRequest.scopes = scopes;
        req.session.authCodeRequest.state = state;
        req.session.authCodeRequest.redirectUri = redirect;

        req.session.tokenRequest.authority = authority;

        // request an authorization code to exchange for tokens
        try {
            const response = await this.msalClient.getAuthCodeUrl(req.session.authCodeRequest);
            return res.redirect(response);
        } catch (error) {
            console.log(JSON.stringify(error));
            return res.status(500).send(error);
        }
    }

    /**
     * Util method to get the resource name for a given callingPageRoute (appSettings.json)
     * @param {string} path: /path string that the resource is associated with 
     */
    private getResourceName = (path): string => {
        const index = Object.values(this.appSettings.resources).findIndex((resource: Resource) => resource.callingPageRoute === path);
        const resourceName = Object.keys(this.appSettings.resources)[index];
        return resourceName;
    }
}






