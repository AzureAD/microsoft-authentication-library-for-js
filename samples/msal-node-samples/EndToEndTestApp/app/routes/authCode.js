/*
*  Copyright (c) Microsoft. All rights reserved. Licensed under the MIT license.
*  See LICENSE in the source repository root for complete license information.
*/

module.exports = function(app, clientApplication, msalTokenCache, scenarioConfig) {

    const requestConfig = scenarioConfig.request;

    app.get('/', (req, res) => {

        let { authCodeUrlParameters } = requestConfig;
        
        // Check for the state parameter
        if (req.query && req.query.state) authCodeUrlParameters.state = req.query.state;

        // Check for the prompt parameter
        if (req.query && req.query.prompt) authCodeUrlParameters.prompt = req.query.prompt;

        // Check for the loginHint parameter
        if (req.query && req.query.loginHint) authCodeUrlParameters.loginHint = req.query.loginHint;

        // Check for the domainHint parameter
        if (req.query && req.query.domainHint) authCodeUrlParameters.domainHint = req.query.domainHint;
        
        // get url to sign user in and consent to scopes needed for applicatio
        clientApplication.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
            res.redirect(response);
        }).catch((error) => console.log(JSON.stringify(error)));
    });
    
    app.get('/redirect', (req, res) => {

        const tokenRequest = { ...requestConfig.tokenRequest, code: req.query.code };
    
        clientApplication.acquireTokenByCode(tokenRequest).then((response) => {
            res.sendStatus(200);
        }).catch((error) => {
            console.log(error);
            res.status(500).send(error);
        });
    });
}