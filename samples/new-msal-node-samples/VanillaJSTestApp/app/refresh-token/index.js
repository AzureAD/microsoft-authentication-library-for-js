/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = function(clientApplication) {
    const refreshTokenRequest = {
        refreshToken: "",
        scopes: ["user.read"],
    };
    
    clientApplication.acquireTokenByRefreshToken(refreshTokenRequest).then((response) => {
        console.log(JSON.stringify(response));
    }).catch((error) => {
        console.log(JSON.stringify(error));
    });
}
