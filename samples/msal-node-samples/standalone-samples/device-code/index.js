/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var msal = require('@azure/msal-node');

const msalConfig = {
    auth: {
        clientId: "4b0db8c2-9f26-4417-8bde-3f0e3656f8e0",
        authority: "https://login.microsoftonline.com/common",
    }
};

const pca = new msal.PublicClientApplication(msalConfig);

const deviceCodeRequest = {
    deviceCodeCallback: (response) => (console.log(response.message)),
    scopes: ["user.read"],
    timeout: 5,
};

pca.acquireTokenByDeviceCode(deviceCodeRequest).then((response) => {
    console.log(JSON.stringify(response));
}).catch((error) => {
    console.log(JSON.stringify(error));
});

// Uncomment to test cancellation
// setTimeout(function() {
//     deviceCodeRequest.cancel = true;
// }, 12000);
