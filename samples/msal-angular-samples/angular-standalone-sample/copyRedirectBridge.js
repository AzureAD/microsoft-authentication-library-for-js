/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const fs = require('fs');
const path = require('path');

const bridgeDirectory = path.dirname(
  require.resolve('@azure/msal-browser/redirect-bridge')
);

// Angular assets must stay inside the sample workspace.
fs.copyFileSync(
  path.join(bridgeDirectory, 'msal-redirect-bridge.min.js'),
  path.join(__dirname, 'public', 'redirect', 'msal-redirect-bridge.min.js')
);
