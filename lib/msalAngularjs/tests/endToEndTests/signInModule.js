var helpers = require('./helpers');
var pages = require('./pages');
var logging = require('./logging');
var EC = protractor.ExpectedConditions;
var _this;

class SignInModule {

    constructor() {
        _this = this;
    }

    login() {
        logging.log("Login method called");
        var loginId, nextButton, passwordField;
        var loginButton = element(by.id('loginButton'));
        return browser.wait(EC.visibilityOf(loginButton), 5000, 'Login button is not displayed on the dom').then(function () {
            return loginButton.click();
        });
    }

    enterCredentials(userName, password) {
        var loginButton = element(by.id('loginButton'));
        var loginId = element(by.id('i0116'));
        var nextButton = element(by.id('idSIButton9'));
        var passwordField = element(by.id('i0118'));
        return browser.wait(EC.visibilityOf(loginId), 5000).then(function () {
            loginId.sendKeys(userName);
            return browser.wait(EC.elementToBeClickable(nextButton), 5000, 'Sign in button is not clickable');
        }).then(function () {
            return nextButton.click();
        }).then(function () {
            return browser.wait(EC.visibilityOf(passwordField), 5000, 'Password field is not visible');
        }).then(function () {
            passwordField.sendKeys(password);
            return browser.wait(EC.elementToBeClickable(nextButton), 5000, 'Sign in button is not clickable');
        }).then(function () {
            return nextButton.click();
        });
    }

    checkLoginState(userName, password) {
        var loginButton = element(by.id('loginButton'));
        return browser.wait(pages.signInPage(), 5000).then(function () {
            return _this.checkOtherAccountLink(userName, password);
        })
    }

    checkOtherAccountLink(userName, password) {
        var otherAccountLink = element(by.id('otherTileText'));
        return otherAccountLink.isPresent().then(function (result) {
            if (result) {
                console.log("present");
                return otherAccountLink.click().then(function () {
                    return _this.enterCredentials(userName, password);
                });
            }
            else {
                console.log("not present");
                return _this.enterCredentials(userName, password);
            }
        });
    };

    logout() {
        logging.log("Logout method called");
        return browser.wait(pages.homePage(), 5000).then(function () {
            var logoutButton = element(by.id('logoutButton'));
            return browser.wait(EC.visibilityOf(logoutButton), 5000, 'Logout button is not displayed on the dom').then(function () {
                return logoutButton.click().then(function () {
                    var elem = element.all(by.xpath('.//*[.="Signed in"]')).first();
                    return elem.click();
                });
            });
        });
    }
};

module.exports = new SignInModule();  