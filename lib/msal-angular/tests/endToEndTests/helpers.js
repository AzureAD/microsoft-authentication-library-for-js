var localStorage = require('./localStorage');
var logging = require('./logging');
var settings = require('./config');
var Storage = require('./constants');

var EC = protractor.ExpectedConditions;

module.exports = {

    login: function (userName, password) {
        var loginId, nextButton, passwordField;
        return browser.wait(module.exports.signInPage(), 5000).then(function () {
            loginId = element(by.id('i0116'));
            nextButton = element(by.id('idSIButton9'));
            passwordField = element(by.id('i0118'));
            return browser.wait(EC.visibilityOf(loginId), 5000);
        }).then(function () {
            loginId.sendKeys(userName);
            return browser.wait(EC.elementToBeClickable(nextButton), 5000, 'Sign in button is not clickable');
        }).then(function () {
            return nextButton.click();
        }).then(function () {
            return browser.wait(EC.visibilityOf(passwordField), 5000, 'Password field is not visible');
        }).then(function () {
            passwordField.sendKeys(password);
            return nextButton.click();
        });
    },

    enterCredentials: function (userName, password) {
        var otherAccountLink = element(by.id('otherTileText'));
        return otherAccountLink.isPresent().then(function (result) {
            if (result) {
                return otherAccountLink.click().then(function () {
                    return module.exports.login(userName, password);
                });
            }
            else {
                return module.exports.login(userName, password);
            }
        });
    },

    logout: function () {
        logging.log("logout method called");
        return browser.wait(module.exports.homePage(), 5000).then(function () {
            var logoutButton = element(by.id('logoutButton'));
            return browser.wait(EC.visibilityOf(logoutButton), 5000, 'Logout button is not displayed on the dom').then(function () {
                return logoutButton.click().then(function () {
                    var elem = element(by.xpath('.//*[.="Signed in"]'))
                   return elem.click();
                });
            });
        });
    },

    getAccessTokenKey: function (scopes) {
        return localStorage.getValue("userIdentifier").then(function (userIdentifier) {
            var access_token_key = {
                "authority": settings.instance + "/" + settings.tenant + "/",
                "clientId": settings.clientID,
                "scopes": scopes,
                "userIdentifier": userIdentifier.replace(/\"/g, "")
            };
            return access_token_key;
        });
    },

    signInPage: function () {
        return function () {
            return browser.getTitle().then(function (title) {
                return title === 'Sign in to your account';
            });
        }
    },

    homePage: function () {
        return function () {
            return browser.getTitle().then(function (title) {
                return title === 'MSAL Angular sample app';
            });
        }
    },

    validateCache: function (scopes) {
        if (scopes.indexOf(settings.clientID) != -1)
            logging.log("Verifying BrowserCache for id_token");
        else
            logging.log("Verifying BrowserCache for access_token");
        return browser.wait(module.exports.homePage(), 5000, 'Error navigating to home Page').then(function () {
            expect(element(by.id('logoutButton')).isDisplayed()).toBeTruthy();
            expect(localStorage.getValue(Storage.IDTOKEN)).not.toEqual('');
            expect(localStorage.getValue(Storage.ERROR)).toEqual('');
            expect(localStorage.getValue(Storage.ERROR_DESCRIPTION)).toEqual('');
            return localStorage.getValue(Storage.STATE_LOGIN);
        }).then(function (state) {
            expect(localStorage.getValue(Storage.TOKEN_RENEW_STATUS + state)).not.toEqual('');
            return localStorage.getAllkeys();
        }).then(function (keys) {
            return  module.exports.getAccessToken(keys, scopes);
        }).then(function (accessTokenKey) {
            logging.log(accessTokenKey);
            return accessTokenKey;
        });
    },

    getAccessToken: function (keys, scopes) {
        var results = [];
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            if (key.indexOf("clientId") != -1 && key.indexOf("userIdentifier") != -1) {
                var accessTokenKey = JSON.parse(key);
                results.push(accessTokenKey);
            }
        }
        for (var i = 0; i < results.length; i++) {
            if (module.exports.containsScope(results[i].scopes.split(" "), scopes)) {
                logging.log("Getting access_token/id_token key for scope: " + scopes + " from storage");
                return results[i];
            }
        }
        return null;
    },

    containsScope: function (cachedScopes, scopes) {
        cachedScopes = module.exports.convertToLowerCase(cachedScopes);
        return scopes.every(function (value) {
            return cachedScopes.indexOf(value.toString().toLowerCase()) >= 0;
        });
    },

    convertToLowerCase: function (scopes) {
        return scopes.map(function (scope) {
            return scope.toLowerCase();
        });
    },

    validateLogout: function () {
        return localStorage.getStorage().then(function (storage) {
            return localStorage.getAllkeys();
        }).then(function (keys) {
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (key.indexOf("msal") != -1)
                    expect(localStorage.getValue(key)).toEqual('');
            }
            return;
        })
    },

    urlChanged: function (oldUrl) {
        return function () {
            return browser.getCurrentUrl().then(function (newUrl) {
                return oldUrl != newUrl;
            });
        };
    }
}
