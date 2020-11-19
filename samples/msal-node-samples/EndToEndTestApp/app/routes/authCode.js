/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/

module.exports = function(app, clientApplication, msalTokenCache, scenarioConfig) {
    const requestConfig = scenarioConfig.request;
    app.get('/', (req, res) => {
        // get url to sign user in and consent to scopes needed for applicatio
        clientApplication.getAuthCodeUrl(requestConfig.authCodeUrlParameters).then((response) => {
            res.redirect(response);
        }).catch((error) => console.log(JSON.stringify(error)));
    });
    
    app.get('/redirect', (req, res) => {
        const tokenRequest = {
            ...requestConfig.tokenRequest,
            code: req.query.code
        };
    
        clientApplication.acquireTokenByCode(tokenRequest).then((response) => {
            console.log("\nResponse: \n:", response);
            res.sendStatus(200);
        }).catch((error) => {
            console.log(error);
            res.status(500).send(error);
        });
    });
}