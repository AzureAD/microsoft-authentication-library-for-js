/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

 module.exports = function(scenarioConfig, clientApplication, runtimeOptions) {
    const requestConfig = scenarioConfig.request;

    const deviceCodeRequest = { 
        ...requestConfig.deviceCodeUrlParameters,
        deviceCodeCallback: (response) => (console.log(response.message))
    };

    // Check if a timeout was provided at runtime.
    if (runtimeOptions.timeout) {
        deviceCodeRequest.timeout = runtimeOptions.timeout;
    }
    
    clientApplication.acquireTokenByDeviceCode(deviceCodeRequest).then((response) => {
        console.log(JSON.stringify(response));
    }).catch((error) => {
        console.log(JSON.stringify(error));
    });
 }