/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var msal = require('@azure/msal-node');

const config = {
    auth: {
        clientId: "<CLIENT_ID>",
        authority: "https://login.microsoftonline.com/<TENANT_ID>",
        clientSecret: "<CLIENT_SECRET>",
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(config);

// With client credentials flows permissions need to be granted in the portal by a tenant administrator. 
// The scope is always in the format "<resource>/.default"
const clientCredentialRequest = {
    scopes: ["https://graph.microsoft.com/.default"],
    azureRegion: "westus2",
    skipCache: true, 
};

cca.acquireTokenByClientCredential(clientCredentialRequest).then((response) => {
    console.log("Response: ", response);
}).catch((error) => {
    console.log(JSON.stringify(error));
});
