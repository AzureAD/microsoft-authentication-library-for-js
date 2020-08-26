/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const msal = require('@azure/msal-node');
const authConfig = require('./authConfig');

// Create msal application object
module.exports = new msal.PublicClientApplication(authConfig);