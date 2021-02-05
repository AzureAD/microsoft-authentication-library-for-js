/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var msal = require('@azure/msal-node');

const msalConfig = {
    auth: {
        clientId: "6c04f413-f6e7-4690-b372-dbdd083e7e5a",
        authority: "https://login.microsoftonline.com/sgonz.onmicrosoft.com", 
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
