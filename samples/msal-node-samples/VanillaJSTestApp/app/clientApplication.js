/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const msal = require('@azure/msal-node');

// Create msal application object
module.exports = function(scenarioPath, clientType) {
    const authConfig = require('./authConfig')(scenarioPath);

    switch(clientType) {
        case "public":
            return new msal.PublicClientApplication(authConfig);
        case "confidential":
            return new msal.ConfidentialClientApplication(authConfig);
        default:
            console.log("Unsopported clientType: ", clientType);
            return null;
    }
}