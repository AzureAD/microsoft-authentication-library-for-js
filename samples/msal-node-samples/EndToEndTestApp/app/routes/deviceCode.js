/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

 module.exports = function(scenarioConfig, clientApplication, runtimeOptions) {
    const requestConfig = scenarioConfig.request;
    const defaultCallback = (response) => console.log(response.message);

    const deviceCodeRequest = { 
        ...requestConfig.deviceCodeUrlParameters,
        deviceCodeCallback: runtimeOptions.deviceCodeCallback || defaultCallback
    };

    // Check if a timeout was provided at runtime.
    if (runtimeOptions.timeout) {
        deviceCodeRequest.timeout = runtimeOptions.timeout;
    }
    
    return clientApplication.acquireTokenByDeviceCode(deviceCodeRequest).then((response) => {
        return response;
    }).catch((error) => {
        return error;
    });
 }