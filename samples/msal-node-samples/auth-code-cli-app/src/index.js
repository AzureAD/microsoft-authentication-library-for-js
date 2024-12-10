/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const { PublicClientApplication, InteractionRequiredAuthError } = require("@azure/msal-node");
const open = require("open");
const { authConfig } = require("./authConfig.js");
const { callMicrosoftGraph } = require("./graph.js");

// Before running the sample, you will need to replace the values in src/authConfig.js


// Open browser to sign user in and consent to scopes needed for application
const openBrowser = async (url) => {
    // You can open a browser window with any library or method you wish to use - the 'open' npm package is used here for demonstration purposes.
    open(url);
};

const loginRequest = {
    scopes: ["User.Read"],
    openBrowser,
    successTemplate: "Successfully signed in! You can close this window now."
};

// Create msal application object
const pca = new PublicClientApplication(authConfig);

const acquireToken = async () => {
    const accounts = await pca.getTokenCache().getAllAccounts();
    if (accounts.length == 1) {
        const silentRequest = {
            account: accounts[0],
            scopes: ["User.Read"]
        }

        return pca.acquireTokenSilent(silentRequest).catch(e => {
            if (e instanceof InteractionRequiredAuthError) {
                return pca.acquireTokenInteractive(loginRequest)
            }
        });
    } else if (accounts.length > 1) {
        accounts.forEach(account => {
            console.log(account.username);
        });
        return Promise.reject("Multiple accounts found. Please select an account to use.");
    } else {
        return pca.acquireTokenInteractive(loginRequest);
    }
}

acquireToken().then((response) => {
    callMicrosoftGraph(response.accessToken).then((graphResponse) => {
        console.log(graphResponse);
        process.exit(0);
    }).catch((error) => {
        process.exit(1);
    });
}).catch((error) => {
    process.exit(1);
});
