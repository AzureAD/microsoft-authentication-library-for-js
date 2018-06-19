describe('E2E tests', function () {

    var settings = {
        appUrl: 'http://localhost:44302',
        instance: 'https://login.microsoftonline.com',
        tenant: 'rohit1.onmicrosoft.com',
        urlNavigate: this.instance + this.tenant + '/oauth2/authorize',
        assignedUser: 'xxxxxxxx',
        password: 'xxxxxxxxx',
        unassignedUser: 'xxxxxxxxxxx',
        clientID: '3f4adad0-057c-47f4-99f1-6e2e78ad4f8e',
        AppIdExternalApi: 'c22b3114-88ce-48fc-b728-3591a2e420a6',
    };

    var Storage = {
        CLIENT_INFO: 'msal.client.info',
        ERROR: 'msal.error',
        ERROR_DESCRIPTION: 'msal.error.description',
        ID_TOKEN: 'msal.idtoken',
        LOGIN_ERROR: 'msal.login.error',
        NONCE_IDTOKEN: 'msal.nonce.idtoken',
        SESSION_STATE: 'msal.session.state',
        STATE_LOGIN: 'msal.state.login',
        TOKEN_RENEW_STATUS: 'msal.token.renew.status',
    };

    var getValueLocalStorage = function (key) {
        return browser.executeScript("return window.localStorage.getItem('" + key + "');");
    };

    var setValueLocalStorage = function (key, value) {
        return browser.executeScript("return window.localStorage.setItem('" + key + "','" + value + "');");
    };

    var removeItemLocalStorage = function (key, value) {
        return browser.executeScript("return window.localStorage.removeItem('" + key + "');");
    };

    var getStorage = function () {
        return browser.executeScript("return window.localStorage;");
    };

    var clearStorage = function () {
        return browser.executeScript("return window.localStorage.clear();");
    };

    var localStorageChanged = function (key, oldValue) {
        return function () {
            return browser.executeScript("return localStorage.getItem('" + key + "');").then(function (newValue) {
                return oldValue !== newValue;
            });
        };
    };

    var getAllAccessTokens = function () {
        return function () {
            return browser.executeScript("return window.").then(function (newValue) {
                console.log(newValue);
            });
        };
    }

    var getSecretsKeyVault = function () {
        var keyVault = require('./keyVault');
        var secretIds = {
            browserstackUser: 'browserstack-user',
            browserstackKey: 'browserstack-key',
            loginPassword: 'login-password'
        }
        return keyVault.getAllSecrets(secretIds);
    }

    var urlChanged = function (oldUrl) {
        return function () {
            return browser.getCurrentUrl().then(function (newUrl) {
                return oldUrl != newUrl;
            });
        };
    };

    var validateLogin = function () {
        log("validating if login was successful");
        browser.wait(homePage(), 5000, 'login error occurred').then(function () {
            expect(element(by.id('logoutButton')).isDisplayed()).toBeTruthy();
            expect(element(by.id('loginButton')).isDisplayed()).not.toBeTruthy();
            expect(getValueLocalStorage(Storage.IDTOKEN)).not.toEqual('');
            expect(getValueLocalStorage(Storage.ERROR)).toEqual('');
            expect(getValueLocalStorage(Storage.ERROR_DESCRIPTION)).toEqual('');
            return getValueLocalStorage(Storage.STATE_LOGIN);
        }).then(function (state) {
            expect(getValueLocalStorage(Storage.TOKEN_RENEW_STATUS + state)).not.toEqual('');
        });

    };

    var signInPage = function () {
        return function () {
            return browser.getTitle().then(function (title) {
                return title === 'Sign in to your account';
            });
        }
    };

    var homePage = function () {
        log("home page loaded");
        return function () {
            return browser.getTitle().then(function (title) {
                return title === 'Todo List: a SPA sample demonstrating Azure AD and MSAL JS';
            });
        }
    };

    var checkLoginState = function (userName, password) {
        var otherAccountLink = element(by.id('otherTileText'));
        return otherAccountLink.isPresent().then(function (result) {
            if (result) {
                return otherAccountLink.click().then(function () {
                    return login(userName, password);
                });
            }
            else {
                return login(userName, password);
            }
        });
    };

    var log = function (message) {
        console.log(message);
    }

    var login = function (userName, password) {
        log("login method called");
        var loginId, nextButton, passwordField;
        return browser.wait(signInPage(), 5000).then(function () {
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
            return browser.wait(EC.visibilityOf(passwordField), 5000, 'Sign in button is not clickable');
        }).then(function () {
            passwordField.sendKeys(password);
            return nextButton.click();
        });
    };

    var logout = function () {
        log("logout method called");
        return browser.wait(homePage(), 5000).then(function () {
            var logoutButton = element(by.id('logoutButton'));
            return browser.wait(EC.visibilityOf(logoutButton), 5000, 'Logout button is not displayed on the dom').then(function () {
                return logoutButton.click().then(function () {
                    var elem = element(by.xpath('.//*[.="Signed in"]'))
                    return elem.click();
                });
            });
        });

    };

    var EC = protractor.ExpectedConditions;

    beforeEach(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
        browser.ignoreSynchronization = true;
        browser.get(settings.appUrl);
        browser.manage().deleteAllCookies();
    });

    it(':1: ' + 'should get secrets from Keyvault', function () {
        let flow = browser.controlFlow();
        flow.execute(getSecretsKeyVault)
            .then(function (result) {
                expect(result.browserstackKey).not.toEqual('');
                expect(result.browserstackUser).not.toEqual('');
                expect(result.loginPassword).not.toEqual('');
            });
    }, 5000);


    it(':2: ' + 'should login using redirectflow and logout', function () {
        var loginButton = element(by.id('loginButton'));
        browser.wait(EC.visibilityOf(loginButton), 5000, 'Login button is not displayed on the dom').then(function () {
            return loginButton.click();
        }).then(function () {
            return browser.wait(signInPage(), 5000, 'Error navigating to Signin Page');
        }).then(function () {
            return login(settings.assignedUser, settings.password);
        }).then(function () {
            return browser.wait(homePage(), 5000, 'Error navigating to home page after sign-in');
        }).then(function () {
            validateLogin();
            return logout();
        })
    });

});