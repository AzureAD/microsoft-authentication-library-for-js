describe('E2ETests', function () {

    var keyVault = require('./keyVault');
    var passworkKey = 'password';
    keyVault.getSecret(passworkKey, function (result) {
        console.log("get secret got called");
        settings.password = result.value;
    });

    var testsId = browser.params.testsId;
    beforeEach(function () {
      /*  jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
        browser.ignoreSynchronization = true;
        browser.get(settings.appUrl);
        removeItemLocalStorage('redirectUri');
        removeItemLocalStorage('popUp');
        browser.executeScript('window.sessionStorage.clear();');
        browser.executeScript('window.localStorage.clear();');
        browser.driver.manage().deleteAllCookies();
*/
        /*  var configButton = element(by.id("configButton"));
          configButton.click().then(function () {
              return clearStorage();
          }).then(function () {
              var logoutButton = element(by.id('logoutButton'));
              return logoutButton.isDisplayed();
          }).then(function (displayed) {
              if (displayed) {
                  logout();
              }
          });
  */
    });

    afterEach(function () {
     /*   browser.getAllWindowHandles().then(function (handles) {
            expect(handles.length).toEqual(1);
        });
*/
    });

    var settings = {
        appUrl: 'http://localhost:4200/',
        instance: 'https://login.microsoftonline.com',
        tenant: 'neagrawa.onmicrosoft.com',
        urlNavigate: this.instance + this.tenant + '/oauth2/authorize',
        assignedUser: 'neha123@neagrawa.onmicrosoft.com',
        unassignedUser: 'neha123@neagrawa.onmicrosoft.com',
        clientID: '3f4adad0-057c-47f4-99f1-6e2e78ad4f8e',
        AppIdExternalApi: 'c22b3114-88ce-48fc-b728-3591a2e420a6',
        externalAPIScope: 'api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user'
    };

    var Storage = {
        TOKEN_KEYS: 'msal.token.keys',
        ACCESS_TOKEN_KEY: 'msal.access.token.key',
        EXPIRATION_KEY: 'msal.expiration.key',
        STATE_LOGIN: 'msal.state.login',
        STATE_RENEW: 'msal.state.renew',
        NONCE_IDTOKEN: 'msal.nonce.idtoken',
        SESSION_STATE: 'msal.session.state',
        USERNAME: 'msal.username',
        IDTOKEN: 'msal.idtoken',
        ERROR: 'msal.error',
        ERROR_DESCRIPTION: 'msal.error.description',
        LOGIN_REQUEST: 'msal.login.request',
        LOGIN_ERROR: 'msal.login.error',
        RENEW_STATUS: 'adal.token.renew.status'
    };

    var urlChanged = function (oldUrl) {
        return function () {
            return browser.getCurrentUrl().then(function (newUrl) {
                return oldUrl != newUrl;
            });
        };
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

    var log = function (message) {
        console.log(message);
    }

    var EC = protractor.ExpectedConditions;

    var login = function (userName, password) {
        log("login method called");
        return browser.wait(signInPage(), 5000).then(function () {
            var loginId = element(by.id('i0116'));
            return browser.wait(EC.visibilityOf(loginId), 5000).then(function () {
                loginId.sendKeys(userName);
                var nextButton = element(by.id('idSIButton9'));
                nextButton.click();
                var loginPassword = element(by.id('i0118'));
                loginPassword.sendKeys(password);
                var signInButton = element(by.id('idSIButton9'));
                return browser.wait(EC.elementToBeClickable(signInButton), 5000, 'Sign in button is not clickable').then(function () {
                    return signInButton.click();
                });
            });
        });
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

    var logout = function () {
        log("logout method called");
        return browser.wait(homePage(), 5000).then(function () {
            var logoutButton = element(by.id('logoutButton'));
            return browser.wait(EC.visibilityOf(logoutButton), 5000, 'Logout button is not displayed on the dom').then(function () {
                return logoutButton.click().then(function () {
                    var elem = element(by.xpath('.//*[.="Signed in"]'))
                    elem.click();
                });
            });
        });

    };

    var validateLogin = function () {
        log("validating if login was successful");
        browser.wait(homePage(), 5000, 'login error occurred').then(function () {
            expect(element(by.id('logoutButton')).isDisplayed()).toBeTruthy();
            expect(getValueLocalStorage(Storage.IDTOKEN)).not.toEqual('');
            expect(getValueLocalStorage(Storage.ACCESS_TOKEN_KEY + settings.clientID)).not.toEqual('');
            expect(getValueLocalStorage(Storage.ERROR)).toEqual('');
            expect(getValueLocalStorage(Storage.ERROR_DESCRIPTION)).toEqual('');
            expect(getValueLocalStorage(Storage.EXPIRATION_KEY)).not.toEqual('');
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
                return title === 'MSAL Angular sample app';
            });
        }
    };

    getWindowLocalStorage = function () {
        browser.executeScript("return window.localStorage;");
    };

    getAccessToken = function (clientId, userIdentifier) {
        const storage = getStorage();
        var result;
        if (storage) {
            var key;
            for (key in storage) {
                if (storage.hasOwnProperty(key)) {
                    if (key.match(clientId) && key.match(userIdentifier)) {
                        if (key) {
                            result = key;
                        }
                    }
                }
            }
        } else {
            throw new Error("localStorage and sessionStorage are not supported");
        }

        return result;
    }

    it('can find search results', function() {
        browser.driver.get('https://google.com/ncr').then(function() {
            browser.driver.findElement(by.name('q')).sendKeys('BrowserStack\n').then(function() {
                expect(browser.driver.getTitle()).toEqual('BrowserStack - Google Search');
            });
        });
    });

});
