/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var msal = require('@azure/msal-node');

const config = {
    auth: {
        clientId: "6c04f413-f6e7-4690-b372-dbdd083e7e5a",
        authority: "https://login.microsoftonline.com/sgonz.onmicrosoft.com",
    }
};

const pca = new msal.PublicClientApplication(config);

const refreshTokenRequest = {
    refreshToken: "",
    scopes: ["user.read"],
};

pca.acquireTokenByRefreshToken(refreshTokenRequest).then((response) => {
    console.log(JSON.stringify(response));
}).catch((error) => {
    console.log(JSON.stringify(error));
});
