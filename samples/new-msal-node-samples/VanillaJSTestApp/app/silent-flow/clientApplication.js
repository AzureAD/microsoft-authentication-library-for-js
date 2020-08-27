/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const msal = require('@azure/msal-node');

// Create msal application object
module.exports = function(authorityConfigSubdir) {
    const authConfig = require(`./${authorityConfigSubdir}/authConfig`);
    return new msal.PublicClientApplication(authConfig);
}