/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
 const msal = require('@azure/msal-node');
const authConfig = require('./authConfig');

// Create msal application object
module.exports = new msal.PublicClientApplication(authConfig);