/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/
const express = require('express');
// Initializes express server with scenario routes when scenario is web app type
module.exports = function (scenarioConfig, port, clientApplication, routesPath) {
    // Initialize MSAL Token Cache
    const msalTokenCache = clientApplication.getTokenCache();

    // Initialize express app
    const app = express();

    // Load sample routes
    const sampleRoutes = require(routesPath);
    sampleRoutes(app, clientApplication, msalTokenCache, scenarioConfig);
    
    // Start and return server
    return app.listen(port, () => console.log(`Msal Node Sample App listening on port ${port}!`));
}