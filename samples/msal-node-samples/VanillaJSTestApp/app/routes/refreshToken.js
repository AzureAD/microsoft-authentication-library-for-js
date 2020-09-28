/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = function(scenarioConfiguration, clientApplication) {
    const requestConfig = scenarioConfiguration.request;
    
    const refreshTokenRequest = requestConfig.refreshTokenRequestParameters;

    clientApplication.acquireTokenByRefreshToken(refreshTokenRequest).then((response) => {
        console.log(JSON.stringify(response));
    }).catch((error) => {
        console.log(JSON.stringify(error));
    });
}
