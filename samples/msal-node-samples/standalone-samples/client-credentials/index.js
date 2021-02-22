/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var msal = require('@azure/msal-node');

const config = {
    auth: {
        clientId: "6cae280d-dab5-4a63-87f7-38bc383dd8a3",
        authority: "https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47",
        clientSecret: "HX8_2DBRk1.cbV_XS5L0UraJe-2Q14jCrI"
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
    prefferedAzureRegionOptions: {
        useAzureRegion: true,
        regionUsedIfAutoDetectionFails: "westus2",
        fallbackToGlobal: true,
    } 
};

cca.acquireTokenByClientCredential(clientCredentialRequest).then((response) => {
    console.log("Response: ", response);
}).catch((error) => {
    console.log(JSON.stringify(error));
});
