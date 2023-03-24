/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const express = require('express');
const msal = require('@azure/msal-node');
const axios = require('axios');

const {
    msalConfig,
    REDIRECT_URI,
    POST_LOGOUT_REDIRECT_URI
} = require('../authConfig');

const router = express.Router();
const cryptoProvider = new msal.CryptoProvider();

router.get('/signin', async function (req, res, next) {

    // create a GUID for crsf
    req.session.csrfToken = cryptoProvider.createNewGuid();

    /**
     * The MSAL Node library allows you to pass your custom state as state parameter in the Request object.
     * The state parameter can also be used to encode information of the app's state before redirect.
     * You can pass the user's state in the app, such as the page or view they were on, as input to this parameter.
     */
    const state = cryptoProvider.base64Encode(
        JSON.stringify({
            csrfToken: req.session.csrfToken,
            redirectTo: '/'
        })
    );

    const authCodeUrlRequestParams = {
        state: state,

        /**
         * By default, MSAL Node will add OIDC scopes to the auth code url request. For more information, visit:
         * https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
         */
        scopes: [],
    };

    const authCodeRequestParams = {
        state: state,

        /**
         * By default, MSAL Node will add OIDC scopes to the auth code request. For more information, visit:
         * https://docs.microsoft.com/azure/active-directory/develop/v2-permissions-and-consent#openid-connect-scopes
         */
        scopes: [],
    };

    /**
     * If the current msal configuration does not have cloudDiscoveryMetadata or authorityMetadata, we will 
     * make a request to the relevant endpoints to retrieve the metadata. This allows MSAL to avoid making 
     * metadata discovery calls, thereby improving performance of token acquisition process.
     */
    if (!msalConfig.auth.cloudDiscoveryMetadata || !msalConfig.auth.authorityMetadata) {

        const [cloudDiscoveryMetadata, authorityMetadata] = await Promise.all([
            getCloudDiscoveryMetadata(),
            getAuthorityMetadata()
        ]);

        msalConfig.auth.cloudDiscoveryMetadata = JSON.stringify(cloudDiscoveryMetadata);
        msalConfig.auth.authorityMetadata = JSON.stringify(authorityMetadata);
    }

    const msalInstance = getMsalInstance(msalConfig);

    // trigger the first leg of auth code flow
    return redirectToAuthCodeUrl(req, res, next, msalInstance, authCodeUrlRequestParams, authCodeRequestParams)
});

router.post('/redirect', async function (req, res, next) {
    const authCodeRequest = {
        ...req.session.authCodeRequest,
        code: req.body.code, // authZ code
        codeVerifier: req.session.pkceCodes.verifier // PKCE Code Verifier
    };

    try {
        const msalInstance = getMsalInstance(msalConfig);
        msalInstance.getTokenCache().deserialize(req.session.tokenCache);

        const tokenResponse = await msalInstance.acquireTokenByCode(authCodeRequest, req.body);

        req.session.tokenCache = msalInstance.getTokenCache().serialize();
        req.session.idToken = tokenResponse.idToken;
        req.session.account = tokenResponse.account;
        req.session.isAuthenticated = true;

        const state = JSON.parse(cryptoProvider.base64Decode(req.body.state));
        res.redirect(state.redirectTo);
    } catch (error) {
        next(error);
    }
});

router.get('/signout', function (req, res) {
    /**
     * Construct a logout URI and redirect the user to end the
     * session with Azure AD. For more information, visit:
     * https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc#send-a-sign-out-request
     */
    const logoutUri = `${msalConfig.auth.authority}/oauth2/v2.0/logout?post_logout_redirect_uri=${POST_LOGOUT_REDIRECT_URI}`;

    req.session.destroy(() => {
        res.redirect(logoutUri);
    });
});

/**
 * Instantiates a new CCA given configuration
 * @param msalConfig 
 * @returns 
 */
function getMsalInstance(msalConfig) {
    return new msal.ConfidentialClientApplication(msalConfig);
};

/**
 * Retrieves cloud discovery metadata from the /discovery/instance endpoint
 * @returns 
 */
async function getCloudDiscoveryMetadata() {
    const endpoint = 'https://login.microsoftonline.com/common/discovery/instance';

    try {
        const response = await axios.get(endpoint, {
            params: {
                'api-version': '1.1',
                'authorization_endpoint': `${msalConfig.auth.authority}/oauth2/v2.0/authorize`
            }
        });

        return await response.data;
    } catch (error) {
        console.log(error);
    }
}

/**
 * Retrieves oidc metadata from the openid endpoint
 * @returns 
 */
async function getAuthorityMetadata() {
    const endpoint = `${msalConfig.auth.authority}/v2.0/.well-known/openid-configuration`;

    try {
        const response = await axios.get(endpoint);
        return await response.data;
    } catch (error) {
        console.log(error);
    }
}

/**
 * Prepares the auth code request parameters and initiates the first leg of auth code flow
 * @param req: Express request object
 * @param res: Express response object
 * @param next: Express next function
 * @param authCodeUrlRequestParams: parameters for requesting an auth code url
 * @param authCodeRequestParams: parameters for requesting tokens using auth code
 */
async function redirectToAuthCodeUrl(req, res, next, msalInstance, authCodeUrlRequestParams, authCodeRequestParams) {

    // Generate PKCE Codes before starting the authorization flow
    const { verifier, challenge } = await cryptoProvider.generatePkceCodes();

    // Set generated PKCE codes and method as session vars
    req.session.pkceCodes = {
        challengeMethod: 'S256',
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
        ...authCodeUrlRequestParams,
        redirectUri: REDIRECT_URI,
        responseMode: 'form_post', // recommended for confidential clients
        codeChallenge: req.session.pkceCodes.challenge,
        codeChallengeMethod: req.session.pkceCodes.challengeMethod,
    };

    req.session.authCodeRequest = {
        ...authCodeRequestParams,
        redirectUri: REDIRECT_URI,
        code: "",
    };

    // Get url to sign user in and consent to scopes needed for application
    try {
        const authCodeUrlResponse = await msalInstance.getAuthCodeUrl(req.session.authCodeUrlRequest);
        res.redirect(authCodeUrlResponse);
    } catch (error) {
        next(error);
    }
};



module.exports = router;
