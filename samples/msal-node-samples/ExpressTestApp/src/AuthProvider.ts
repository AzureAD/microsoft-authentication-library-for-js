/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Request,
    Response,
    NextFunction
} from "express";

import {
    InteractionRequiredAuthError,
    OIDC_DEFAULT_SCOPES,
    ResponseMode
} from '@azure/msal-common';

import {
    IConfidentialClientApplication,
    ConfidentialClientApplication,
    Configuration,
    AccountInfo,
    CryptoProvider,
    AuthorizationUrlRequest,
    AuthorizationCodeRequest
} from '@azure/msal-node';

import { ConfigurationUtils } from './ConfigurationUtils';

import {
    AppSettings,
    Resource,
} from './Types';

import { AppStages, ErrorMessages } from './Constants';

/**
 * A simple wrapper around MSAL Node ConfidentialClientApplication object.
 * It offers a collection of middleware and utility methods that automate
 * basic authentication and authorization tasks in Express MVC web apps.
 *
 * You must have express and express-sessions packages installed. Middleware here
 * can be used with express sessions in route controllers.
 *
 * Session variables accessible are as follows:
    * req.session.isAuthenticated: boolean
    * req.session.account: AccountInfo
    * req.session.<resourceName>.accessToken: string
 */
export class AuthProvider {

    appSettings: AppSettings;
    msalConfig: Configuration;

    private cryptoProvider: CryptoProvider;

    constructor(appSettings: AppSettings) {
        ConfigurationUtils.validateAppSettings(appSettings);

        this.cryptoProvider = new CryptoProvider();

        this.appSettings = appSettings;
        this.msalConfig = ConfigurationUtils.getMsalConfiguration(appSettings);
    }

    private initializeMsalClient(): IConfidentialClientApplication {
        return new ConfidentialClientApplication(this.msalConfig);
    }

    // ========== MIDDLEWARE ===========

    /**
     * Initiate sign in flow
     * @param {Request} req: express request object
     * @param {Response} res: express response object
     * @param {NextFunction} next: express next
     */
    signIn = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        /**
         * Request Configuration
         * We manipulate these two request objects below
         * to acquire a token with the appropriate claims
         */
        if (!req.session["tokenRequest"]) {
            req.session.tokenRequest = {
                authority: "",
                scopes: [],
                redirectUri: "",
                code: "",
            } as AuthorizationCodeRequest;
        }

        // signed-in user's account
        if (!req.session["account"]) {
            req.session.account = {
                homeAccountId: "",
                environment: "",
                tenantId: "",
                username: "",
                idTokenClaims: {},
            } as AccountInfo;
        }

        // random GUID for csrf check
        req.session.csrfToken = this.cryptoProvider.createNewGuid();

        /**
         * The OAuth 2.0 state parameter can be used to encode information of the app's state before redirect.
         * You can pass the user's state in the app, such as the page or view they were on, as input to this parameter.
         * MSAL allows you to pass your custom state as state parameter in the request object. For more information, visit:
         * https://docs.microsoft.com/azure/active-directory/develop/msal-js-pass-custom-state-authentication-request
         */
        const state = this.cryptoProvider.base64Encode(
            JSON.stringify({
                stage: AppStages.SIGN_IN,
                path: req.route.path,
                csrfToken: req.session.csrfToken
            })
        );

        const params: AuthorizationUrlRequest = {
            authority: this.msalConfig.auth.authority,
            scopes: OIDC_DEFAULT_SCOPES,
            state: state,
            redirectUri: this.appSettings.settings.redirectUri,
            responseMode: ResponseMode.FORM_POST
        };

        // initiate the first leg of auth code grant to get token
        this.redirectToAuthCodeUrl(req, res, next, params);
    };

    /**
     * Initiate sign out and clean the session
     * @param {Request} req: express request object
     * @param {Response} res: express response object
     * @param {NextFunction} next: express next
     */
    signOut = async (req: Request, res: Response, next: NextFunction): Promise<any> => {

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
     * @param {Request} req: express request object
     * @param {Response} res: express response object
     * @param {NextFunction} next: express next
     */
    handleRedirect = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
        if (!req.body.state) {
            console.log(ErrorMessages.STATE_NOT_FOUND)
            return res.status(401).send(ErrorMessages.NOT_PERMITTED);
        }

        const state = JSON.parse(this.cryptoProvider.base64Decode(req.body.state as string));

        // check if csrfToken matches
        if (state.csrfToken !== req.session.csrfToken) {
            console.log(ErrorMessages.NONCE_MISMATCH)
            return res.status(401).send(ErrorMessages.NOT_PERMITTED);
        }

        switch (state.stage) {
            case AppStages.SIGN_IN:
                // token request should have auth code
                req.session.tokenRequest.code = req.body.code as string;

                try {
                    const msalClient = this.initializeMsalClient();

                    // exchange auth code for tokens
                    const tokenResponse = await msalClient.acquireTokenByCode(req.session.tokenRequest)
                    console.log("\nResponse: \n:", tokenResponse);

                    // assign session variables
                    req.session.tokenCache = msalClient.getTokenCache().serialize();
                    req.session.account = tokenResponse.account;
                    req.session.isAuthenticated = true;

                    return res.status(200).redirect(this.appSettings.settings.homePageRoute);

                } catch (error) {
                    console.log(error);
                    next(error);
                }

                break;

            case AppStages.ACQUIRE_TOKEN:
                // get the name of the resource associated with scope
                const resourceName = this.getResourceName(state.path);

                req.session.tokenRequest.code = req.body.code as string

                try {
                    const msalClient = this.initializeMsalClient();
                    const tokenResponse = await msalClient.acquireTokenByCode(req.session.tokenRequest);
                    console.log("\nResponse: \n:", tokenResponse);

                    // assign session variables
                    req.session.tokenCache = msalClient.getTokenCache().serialize();
                    req.session[resourceName].accessToken = tokenResponse.accessToken;
                    return res.status(200).redirect(state.path);

                } catch (error) {
                    console.log(error);
                    next(error);
                }

                break;

            default:
                res.status(500).send(ErrorMessages.CANNOT_DETERMINE_APP_STAGE);
        }

    };

    /**
     * Middleware that gets tokens and calls web APIs
     * @param {Request} req: express request object
     * @param {Response} res: express response object
     * @param {NextFunction} next: express next
     */
    getToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

        // get scopes for token request
        const scopes = (<Resource>Object.values(this.appSettings.resources)
            .find((resource: Resource) => resource.callingPageRoute === req.route.path)).scopes;

        const resourceName = this.getResourceName(req.route.path);

        if (!req.session[resourceName]) {
            req.session[resourceName] = {
                accessToken: null,
            };
        }

        try {
            const msalClient = this.initializeMsalClient();
            msalClient.getTokenCache().deserialize(req.session.tokenCache);

            const account = await msalClient.getTokenCache()
                .getAccountByHomeId(req.session.account.homeAccountId);

            const silentRequest = {
                account: account,
                scopes: scopes,
            };

            // acquire token silently to be used in resource call
            const tokenResponse = await msalClient.acquireTokenSilent(silentRequest)
            console.log("\nSuccessful silent token acquisition:\n Response: \n:", tokenResponse);

            // serialize the cache blob to session store
            req.session.tokenCache = msalClient.getTokenCache().serialize();

            // In B2C scenarios, sometimes an access token is returned empty.
            // In that case, we will acquire token interactively instead.
            if (tokenResponse.accessToken.length === 0) {
                console.log(ErrorMessages.TOKEN_NOT_FOUND);
                throw new InteractionRequiredAuthError(ErrorMessages.INTERACTION_REQUIRED);
            }

            req.session[resourceName].accessToken = tokenResponse.accessToken;
            next();

        } catch (error) {
            // in case there are no cached tokens, initiate an interactive call
            if (error instanceof InteractionRequiredAuthError) {
                console.log('Silent token acquisition failed, acquiring token interactively');

                const state = this.cryptoProvider.base64Encode(
                    JSON.stringify({
                        stage: AppStages.ACQUIRE_TOKEN,
                        path: req.route.path,
                        csrfToken: req.session.csrfToken
                    })
                );

                const params: AuthorizationUrlRequest = {
                    authority: this.msalConfig.auth.authority,
                    scopes: scopes,
                    state: state,
                    redirectUri: this.appSettings.settings.redirectUri,
                    responseMode: ResponseMode.FORM_POST,
                    account: req.session.account,
                };

                // initiate the first leg of auth code grant to get token
                this.redirectToAuthCodeUrl(req, res, next, params);
            } else {
                next(error);
            }
        }
    }

    // ============== GUARD ===============

    /**
     * Check if authenticated in session
     * @param {Request} req: express request object
     * @param {Response} res: express response object
     * @param {NextFunction} next: express next
     */
    isAuthenticated = (req: Request, res: Response, next: NextFunction): Response | void => {
        if (req.session) {
            if (!req.session.isAuthenticated) {
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
     * @param {Request} req: express request object
     * @param {Response} res: express response object
     * @param {NextFunction} next: express next
     * @param {AuthorizationUrlRequest} params: modify auth code url request
     */
    private redirectToAuthCodeUrl = async (req: Request, res: Response, next: NextFunction, params: AuthorizationUrlRequest): Promise<void> => {

        // prepare the token request
        req.session.tokenRequest.authority = params.authority;
        req.session.tokenRequest.scopes = params.scopes;
        req.session.tokenRequest.redirectUri = params.redirectUri;

        // request an authorization code to exchange for tokens
        try {
            const msalClient = this.initializeMsalClient();
            const response = await msalClient.getAuthCodeUrl(params);
            res.redirect(response);
        } catch (error) {
            console.log(error);
            next(error);
        }
    }

    /**
     * Util method to get the resource name for a given callingPageRoute (appSettings.json)
     * @param {string} path: route path
     */
    private getResourceName = (path: string): string => {
        const index = Object.values(this.appSettings.resources)
            .findIndex((resource: Resource) => resource.callingPageRoute === path);

        const resourceName = Object.keys(this.appSettings.resources)[index];
        return resourceName;
    }
}






