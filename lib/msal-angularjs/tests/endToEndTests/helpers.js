var config = require('./config');
var localStorage = require('./localStorage');
var constants = require('./constants');
var keyVault = require('./keyVault');
var pages = require('./pages');
var logging = require('./logging');
var _this;

class Helpers {

    constructor() {
        _this = this;
    }

    getSecretsKeyVault() {
        logging.log("Keyvault Get request to retrieve secret");
        var secretIds = {
            browserstackUser: 'browserstack-user',
            browserstackKey: 'browserstack-key',
            loginPassword: 'login-password'
        }
        return keyVault.getAllSecrets(secretIds);
    };

    validateCache(scopes) {
        if (scopes.indexOf(config.clientID) != -1)
            logging.log("Verifying BrowserCache for id_token");
        else
            logging.log("Verifying BrowserCache for access_token");

        return browser.wait(pages.homePage(), 5000, 'login error occurred').then(function () {
            expect(element(by.id('logoutButton')).isDisplayed()).toBeTruthy();
            expect(element(by.id('loginButton')).isDisplayed()).not.toBeTruthy();
            expect(localStorage.getValue(constants.IDTOKEN)).not.toEqual('');
            expect(localStorage.getValue(constants.ERROR)).toEqual('');
            expect(localStorage.getValue(constants.ERROR_DESCRIPTION)).toEqual('');
            return localStorage.getValue(constants.STATE_LOGIN);
        }).then(function (state) {
            expect(localStorage.getValue(constants.TOKEN_RENEW_STATUS + state)).not.toEqual('');
            return localStorage.get();
        }).then(function (storage) {
            return localStorage.keys();
        }).then(function (keys) {
            var accessTokenKey = _this.getAccessToken(keys, scopes);
            return accessTokenKey;
        });
    };

    validateLogout() {
        return localStorage.get().then(function (storage) {
            return localStorage.keys();
        }).then(function (keys) {
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (key.indexOf("msal") != -1)
                    expect(localStorage.getValue(key)).toEqual('');
            }
            return;
        });
    }

    getAccessToken(keys, scopes) {
        var results = [];
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key.indexOf("clientId") != -1 && key.indexOf("userIdentifier") != -1) {
                var accessTokenKey = JSON.parse(key);
                results.push(accessTokenKey);
            }
        }
        for (var i = 0; i < results.length; i++) {
            if (_this.containsScope(results[i].scopes.split(" "), scopes)) {
                logging.log("Getting access_token/id_token key for scope: " + scopes + " from storage");
                return results[i];
            }
        }
        console.log(results);
        return null;
    };

    containsScope(cachedScopes, scopes) {
        cachedScopes = _this.convertToLowerCase(cachedScopes);
        return scopes.every(function (value) { return cachedScopes.indexOf(value.toString().toLowerCase()) >= 0; });
    };

    convertToLowerCase(scopes) {
        return scopes.map(function (scope) { return scope.toLowerCase(); });
    };
};

module.exports = new Helpers();