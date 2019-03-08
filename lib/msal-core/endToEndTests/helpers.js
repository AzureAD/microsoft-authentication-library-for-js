var webdriver = require('selenium-webdriver');
var until = webdriver.until;
var localStorage = require('./localStorage');
var chai = require('chai');
var expect = chai.expect;
var settings = require('./config');
var constants = require('./constants');

module.exports = {

    login: async function(driver, userName, password) {
        module.exports.validateParams(driver);

        await driver.wait(until.elementLocated(webdriver.By.id('idSIButton9')), 5000);
        await driver.wait(until.elementLocated(webdriver.By.id('i0116')), 5000);
        var nextBtn = await driver.findElement(webdriver.By.id('idSIButton9'));
        var usernameInput = await driver.findElement(webdriver.By.id('i0116'));

        await usernameInput.sendKeys(userName);
        await nextBtn.click();
        await driver.sleep(1000);

        await driver.wait(until.elementLocated(webdriver.By.id('idSIButton9')), 5000);
        await driver.wait(until.elementLocated(webdriver.By.id('i0118')), 5000);
        var submitBtn = await driver.findElement(webdriver.By.id('idSIButton9'));
        var passwordInput = await driver.findElement(webdriver.By.id('i0118'));
        await passwordInput.sendKeys(password);
        await submitBtn.click();
        await driver.sleep(1000);
    },

    logout: async function(driver) {
        var signOutBtn = await driver.findElement(webdriver.By.css('.table')).click();
    },

    // TODO: update with other required params
    validateParams: async function(driver) {
        var urlNavigate = await driver.getCurrentUrl();
        expect(urlNavigate).to.not.include('&prompt=');
    },

    validateLogin: async function(driver, scopes) {
        localStorage.setDriver(driver);
        return await driver.findElement(webdriver.By.id('SignInPopup')).getText().then(async function (logoutBtnTxt) {
            expect(logoutBtnTxt).to.equal('Sign Out');
            return await driver.findElement(webdriver.By.id('SignInRedirect')).isDisplayed();
        }).then(function (isLoginBtnDisplayed) {
            expect(isLoginBtnDisplayed).to.be.false;
            return localStorage.getValue(constants.ID_TOKEN);
        }).then(function (idtoken) {
            expect(idtoken).to.not.equal('');
            return localStorage.getValue(constants.ERROR);
        }).then(function (error) {
            expect(error).to.equal('');
            return localStorage.getValue(constants.ERROR_DESCRIPTION);
        }).then(function (error_desc) {
            expect(error_desc).to.equal('');
            return localStorage.getValue(constants.STATE_LOGIN);
        }).then(function(state) {
            return localStorage.getValue(constants.TOKEN_RENEW_STATUS + state);
        }).then(function(token_renew_status) {
            expect(token_renew_status).to.not.equal('');
            return localStorage.keys();
        }).then(function(storageKeys) {
            return module.exports.getAccessToken(storageKeys, scopes);
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
                console.log("Getting access_token/id_token key for scope: " + scopes + " from storage");
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

    validateLogout: async function(driver) {
        localStorage.setDriver(driver);
        return localStorage.get().then(function (storage) {
            return localStorage.keys();
        }).then(function (keys) {
            for (var i=0; i < keys.length; i++) {
                var key = keys[i];
                if (key.indexOf("msal") != -1) {
                    localStorage.getValue(key).then(function (value) {
                        expect(value).to.equal('');
                    });
                }
            }
            return;
        });
    },

    getUser: function(browser) {
        return browser.executeScript("return window.myMSALObj.getUser();");
    },
}