/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const msal = require('@azure/msal-node');

// Create msal application object
module.exports = function(scenarioPath) {
    const authConfig = require('./authConfig')(scenarioPath);
    return new msal.PublicClientApplication(authConfig);
}