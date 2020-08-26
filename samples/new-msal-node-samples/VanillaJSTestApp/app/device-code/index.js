/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

 module.exports = function(clientApplication) {
    const deviceCodeRequest = {
        deviceCodeCallback: (response) => (console.log(response.message)),
        scopes: ["user.read"],
    };
    
    clientApplication.acquireTokenByDeviceCode(deviceCodeRequest).then((response) => {
        console.log(JSON.stringify(response));
    }).catch((error) => {
        console.log(JSON.stringify(error));
    });
 }

// Uncomment to test cancellation
// setTimeout(function() {
//     deviceCodeRequest.cancel = true;
// }, 12000);
