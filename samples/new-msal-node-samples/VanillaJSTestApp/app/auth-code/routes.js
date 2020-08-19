module.exports = function(app, clientApplication, msalTokenCache) {
    app.get('/', (req, res) => {
        const authCodeUrlParameters = {
            scopes: ["user.read"],
            redirectUri: "http://localhost:3000/redirect",
        };
    
        // get url to sign user in and consent to scopes needed for applicatio
        clientApplication.getAuthCodeUrl(authCodeUrlParameters).then((response) => {
            res.redirect(response);
        }).catch((error) => console.log(JSON.stringify(error)));
    });
    
    app.get('/redirect', (req, res) => {
        const tokenRequest = {
            code: req.query.code,
            scopes: ["user.read"],
            redirectUri: "http://localhost:3000/redirect",
        };
    
        clientApplication.acquireTokenByCode(tokenRequest).then((response) => {
            console.log("\nResponse: \n:", response);
            msalTokenCache.writeToPersistence();
            res.sendStatus(200);
        }).catch((error) => {
            console.log(error);
            res.status(500).send(error);
        });
    });
}