/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const { PublicClientApplication, InteractionRequiredAuthError } = require('@azure/msal-node');
const open = require('open');
const { msalConfig, loginRequest } = require('./authConfig');

// Before running the sample, you will need to replace the values in src/authConfig.js

// Open browser to sign user in and consent to scopes needed for application
const openBrowser = async (url) => {
    // You can open a browser window with any library or method you wish to use - the 'open' npm package is used here for demonstration purposes.
    open(url);
};

const tokenRequest = {
    ...loginRequest,
    openBrowser,
    successTemplate: '<h1>Successfully signed in!</h1> <p>You can close this window now.</p>',
    errorTemplate:
        '<h1>Oops! Something went wrong</h1> <p>Navigate back to the Electron application and check the console for more information.</p>',
};

/**
 * Initialize a public client application. For more information, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/initialize-public-client-application.md
 */
const pca = new PublicClientApplication(msalConfig);

const acquireToken = async () => {
    const accounts = await pca.getTokenCache().getAllAccounts();
    if (accounts.length === 1) {
        const silentRequest = {
            account: accounts[0],
        };

        return pca.acquireTokenSilent(silentRequest).catch((e) => {
            if (e instanceof InteractionRequiredAuthError) {
                return pca.acquireTokenInteractive(tokenRequest);
            }
        });
    } else if (accounts.length > 1) {
        accounts.forEach((account) => {
            console.log(account.username);
        });
        return Promise.reject('Multiple accounts found. Please select an account to use.');
    } else {
        return pca.acquireTokenInteractive(tokenRequest);
    }
};

acquireToken()
    .then((response) => {
        console.log(response);
    })
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
