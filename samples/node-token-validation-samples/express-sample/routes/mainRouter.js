const express = require('express');
const mainController = require('../controllers/mainController');
const appSettings = require('../appSettings.js');

module.exports = (msalClient, tokenValidator, cryptoProvider) => {

    // Initialize router
    const router = express.Router();

    // App routes
    router.get('/', (req, res, next) => res.redirect('/home'));
    router.get('/home', mainController.getHomePage);

    // Authentication routes
    router.get('/signin', mainController.signIn(msalClient, cryptoProvider, appSettings));
    router.get('/signout', mainController.signOut(appSettings))
    router.get('/redirect', mainController.redirect(msalClient, cryptoProvider));

    // Token validation parameters
    const tokenValidationParams = {
        validIssuers: appSettings.validationParameters.validIssuers,
        validAudiences: appSettings.validationParameters.validAudiences
    };

    // Validate token routes
    router.get('/validate', 
        mainController.getToken('custom', appSettings, msalClient, cryptoProvider),
        tokenValidator.validateTokenMiddleware(tokenValidationParams, 'custom'), 
        (req, res) => {
            console.log('Token validation complete');
            // Call controller or other function with validated access token stored in req.session.protectedResources.custom
            res.status(200).render('home', { isAuthenticated: req.session.isAuthenticated, isValidated: true, token: req.session.protectedResources.custom });  
    });

    // Unauthorized
    router.get('/error', (req, res) => res.redirect('/500.html'));

    // Error
    router.get('/unauthorized', (req, res) => res.redirect('/401.html'));

    // 404
    router.get('*', (req, res) => res.status(404).redirect('/404.html'));

    return router;
}
