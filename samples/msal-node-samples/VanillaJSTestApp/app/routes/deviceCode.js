/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

 module.exports = function(scenarioPath, clientApplication) {
    const requestConfig = require(`${scenarioPath}/requestConfig.json`);

    const deviceCodeRequest = { 
        ...requestConfig.deviceCodeUrlParameters,
        deviceCodeCallback: (response) => (console.log(response.message))
    };
    
    clientApplication.acquireTokenByDeviceCode(deviceCodeRequest).then((response) => {
        console.log(JSON.stringify(response));
    }).catch((error) => {
        console.log(JSON.stringify(error));
    });
 }