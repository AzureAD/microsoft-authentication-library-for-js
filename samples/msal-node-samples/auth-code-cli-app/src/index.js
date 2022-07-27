/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const {PublicClientApplication, LogLevel, InteractionRequiredAuthError} = require("@azure/msal-node");
const open = require("open");

const cacheLocation = "./data/cache.json";
const cachePlugin = require('../../cachePlugin')(cacheLocation);

// Before running the sample, you will need to replace the values in the config.
const config = {
    auth: {
        clientId: "c3a8e9df-f1d4-427d-be73-acab139c40fd",
        authority: "https://login.microsoftonline.com/common"
    },
    cache: {
        cachePlugin
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Verbose,
        }
    }
};

// Get url to sign user in and consent to scopes needed for application
const openBrowser = async (url) => {
    open(url);
};

const loginRequest = {
    scopes: ["User.Read"],
    openBrowser,
    successTemplate: "Successfully signed in! You can close this window now."
};

// Create msal application object
const pca = new PublicClientApplication(config);

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

acquireToken().finally(() => process.exit(0));
