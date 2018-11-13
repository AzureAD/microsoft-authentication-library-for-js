var webdriver = require('selenium-webdriver');
var until = webdriver.until;
var localStorage = require('./localStorage');
var chai = require('chai');
var expect = chai.expect;
var constants = require('./config')

module.exports = {

    login: async function(driver, userName, password) {
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

    validateLogin: async function(driver, scopes) {
        localStorage.setDriver(driver);
        return await driver.findElement(webdriver.By.id('SignInPopup')).then(async function (logoutBtn) {
            expect(logoutBtn.getText()).to.equal('Sign Out');
            return await driver.findElement(webdriver.By.id('SignInRedirect')).isDisplayed();
        }).then(function (isLoginBtnDisplayed) {
            expect(isLoginBtnDisplayed).to.be.false;
            expect(localStorage.getValue(constants.IDTOKEN)).to.not.be.empty;
            expect(localStorage.getValue(constants.ERROR)).to.be.empty;
            expect(localStorage.getValue(constants.ERROR_DESCRIPTION)).to.be.empty;
            expect(localStorage.getValue(constants.TOKEN_RENEW_STATUS) + localStorage.getValue(constants.STATE_LOGIN)).to.not.be.empty;
            return module.exports.getAccessToken(localStorage.keys(), scopes);
        });

        //var signInDisplayed = await driver.findElement(webdriver.By.id('SignInRedirect')).isDisplayed();
        //assert.ok(!signInDisplayed);
        //assert.notEqual(localStorage.getValue(constants.IDTOKEN), '');
        //assert.equal(localStorage.getValue(constants.ERROR), '');
        //assert.equal(localStorage.getValue(constants.ERROR_DESCRIPTION), '');
        //assert.notEqual(localStorage.getValue(constants.TOKEN_RENEW_STATUS) + localStorage.getValue(constants.STATE_LOGIN), '');

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

    validateLogout: async function() {

    },
}