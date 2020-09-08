/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = function(scenarioPath, clientApplication) {
    const requestConfig = require(`${scenarioPath}/requestConfig.json`);
    
    const refreshTokenRequest = requestConfig.refreshTokenRequestParameters;
    
    clientApplication.acquireTokenByRefreshToken(refreshTokenRequest).then((response) => {
        console.log(JSON.stringify(response));
    }).catch((error) => {
        console.log(JSON.stringify(error));
    });
}
