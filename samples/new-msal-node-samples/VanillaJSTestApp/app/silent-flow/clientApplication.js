/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const msal = require('@azure/msal-node');

// Create msal application object
module.exports = function(authorityConfigSubdir, b2cPolicy) {
    const authConfig = require('./authConfig')(authorityConfigSubdir, b2cPolicy);
    return new msal.PublicClientApplication(authConfig);
}