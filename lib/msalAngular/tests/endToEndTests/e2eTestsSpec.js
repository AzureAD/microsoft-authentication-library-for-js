var logging = require('./logging');

describe('E2ETests MSAL Angular', function () {

    beforeEach(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
        browser.ignoreSynchronization = true;
        browser.get(settings.appUrl);
        browser.executeScript('window.sessionStorage.clear();');
        browser.executeScript('window.localStorage.clear();');
        browser.driver.manage().deleteAllCookies();
    });

    afterEach(function () {
        logging.log("End of Test");
        logging.count = 1;
        console.log('');
    });

    var settings = {
        appUrl: 'https://msalangularsample.azurewebsites.net/',
        instance: 'https://login.microsoftonline.com',
        tenant: 'msidlab4.onmicrosoft.com',
        urlNavigate: this.instance + this.tenant + '/oauth2/authorize',
        assignedUser: 'IDLAB@msidlab4.onmicrosoft.com',
        clientID: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773', //lab registration
        AppIdExternalApi: 'c22b3114-88ce-48fc-b728-3591a2e420a6',
        calendarScope: "Calendars.Read",
        externalAPIScope: 'api://a88bb933-319c-41b5-9f04-eff36d985612/access_as_user',
        password: process.env.loginPassword
    };

    var Storage = {
        TOKEN_KEYS: 'msal.token.keys',
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
        TOKEN_RENEW_STATUS: 'msal.token.renew.status'
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

    login =function(userName, password) {
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
            return browser.wait(EC.visibilityOf(passwordField), 5000, 'Password field is not visible');
        }).then(function () {
            passwordField.sendKeys(password);
            return nextButton.click();
        });
    }

    var enterCredentials = function (userName, password) {

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
        logging.log("logout method called");
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

    var getAccessTokenKey = function(scopes) {
        return getValueLocalStorage("userIdentifier").then(function (userIdentifier) {
            var access_token_key = {
                "authority": settings.instance + "/" + settings.tenant + "/",
                "clientId": settings.clientID,
                "scopes": scopes,
                "userIdentifier": userIdentifier.replace(/\"/g, "")
            };
            return access_token_key;
        });
    }

    var signInPage = function () {
        return function () {
            return browser.getTitle().then(function (title) {
                return title === 'Sign in to your account';
            });
        }
    };

    var homePage = function () {
        return function () {
            return browser.getTitle().then(function (title) {
                return title === 'MSAL Angular sample app';
            });
        }
    };

   var getWindowLocalStorage = function () {
        browser.executeScript("return window.localStorage;");
    };


    validateCache = function (scopes) {
        if (scopes.indexOf(settings.clientID) != -1)
            logging.log("Verifying BrowserCache for id_token");
        else
            logging.log("Verifying BrowserCache for access_token");
        return browser.wait(homePage(), 5000, 'Error navigating to home Page').then(function () {
            expect(element(by.id('logoutButton')).isDisplayed()).toBeTruthy();
            expect(getValueLocalStorage(Storage.IDTOKEN)).not.toEqual('');
            expect(getValueLocalStorage(Storage.ERROR)).toEqual('');
            expect(getValueLocalStorage(Storage.ERROR_DESCRIPTION)).toEqual('');
            return getValueLocalStorage(Storage.STATE_LOGIN);
        }).then(function (state) {
            expect(getValueLocalStorage(Storage.TOKEN_RENEW_STATUS + state)).not.toEqual('');
        })
    };


    var getAccessToken = function (scopes) {
        logging.log("checking access_token for scopes " + scopes);
        return getValueLocalStorage("userIdentifier").then(function (userIdentifier) {
            var access_token_key = {
                "authority": settings.instance + "/" + settings.tenant + "/",
                "clientId": settings.clientID,
                "scopes": scopes,
                "userIdentifier": userIdentifier.replace(/\"/g, "")
            };
            return access_token_key;
        })
            .then(function (access_token_key) {
                expect(access_token_key).toBeDefined();
                return getValueLocalStorage(JSON.stringify(access_token_key)).then(function (access_token_value) {
                    return access_token_value;
                });
            });
    }

    var spec1 = it('1:: Should login using redirect flow and logout', function () {
        logging.log(spec1.description, false);
        logging.log("Start of Test");
        var loginRedirectButton = element(by.id('loginRedirectButton'));
        browser.wait(EC.visibilityOf(loginRedirectButton), 5000, 'Login button is not displayed on the dom').then(function () {
            return loginRedirectButton.click();
        }).then(function () {
            return browser.wait(signInPage(), 5000, 'Error navigating to Signin Page');
        }).then(function () {
            return enterCredentials(settings.assignedUser, settings.password);
        }).then(function () {
            return validateCache([settings.clientID]);
        }).then(function () {
          browser.sleep(2000);
         expect(getAccessToken(settings.clientID)).not.toBeNull();
        }).then(function (){
            return logout();
        }).then(function () {
            browser.sleep(1000);
            expect(getValueLocalStorage(Storage.IDTOKEN)).toEqual('');
        });
    });


    var spec2 = it('2 :: should login using popup and logout', function () {
        logging.log(spec2.description, false);
        logging.log("Start of Test");
        browser.sleep(2000);
        var loginButton = element(by.id('loginPopupButton'));
        var mainWindow = null, popUpWindow = null;
        browser.wait(EC.visibilityOf(loginButton), 5000, 'Login button is not displayed on the dom').then(function () {
            return loginButton.click();
        }).then(function () {
            return browser.getAllWindowHandles();
        }).then(function (handles) {
            browser.sleep(2000);
            expect(handles.length).toEqual(2);
            mainWindow = handles[0];
            popUpWindow = handles[1];
            return browser.switchTo().window(popUpWindow);
        }).then(function () {
            return enterCredentials(settings.assignedUser, settings.password);
        }).then(function () {
            return browser.switchTo().window(mainWindow);
        }).then(function () {
            browser.sleep(1000);
            return validateCache([settings.clientID]);
        }).then(function () {
            expect(getAccessToken(settings.clientID)).not.toBeNull();
            return;
        }).then(function () {
                return logout();
        }).then(function () {
            browser.sleep(2000);
            expect(getValueLocalStorage(Storage.IDTOKEN)).toEqual('');
            return;
        });
    });


    var spec3 = it('3 :: Should login using redirect flow, navigate to Calendar tab (MS Graph API) and check if token is served from the cache', function () {
        logging.log(spec3.description, false);
        logging.log("Start of Test");
        browser.sleep(2000);
        var loginRedirectButton = element(by.id('loginRedirectButton'));
        browser.wait(EC.visibilityOf(loginRedirectButton), 5000, 'Login button is not displayed on the dom').then(function () {
            return loginRedirectButton.click();
        }).then(function () {
            return browser.wait(signInPage(), 5000, 'Error navigating to Signin Page');
        }).then(function () {
            return enterCredentials(settings.assignedUser, settings.password);
        }).then(function () {
            return validateCache([settings.clientID]);
        }).then(function () {
            logging.log("Calling MS Graph API");
            return element(by.linkText('Calendar')).click();
        }).then(function () {
            return browser.wait(urlChanged(settings.appUrl), 1000, 'Navigation from root page to Calendar Tab failed');
        }).then(function () {
            expect(browser.getCurrentUrl()).toMatch(settings.appUrl + 'myCalendar');
            return;
        }).then(function () {
            browser.sleep(2000);
            expect(getAccessToken(settings.calendarScope)).not.toBeNull();
            return;
        }).then(function () {
            return logout();
        }).then(function () {
            browser.sleep(1000);
            expect(getValueLocalStorage(Storage.IDTOKEN)).toEqual('');
            expect(getAccessToken()).toBeNull();
        });
    });

    var spec4 = it('4 :: should navigate to a protected route(calendar) using redirect flow and check if user gets redirected to the login page. After successful authentication, user should get redirected back to the protected route', function () {
        logging.log(spec4.description, false);
        logging.log("Start of Test");
        browser.sleep(2000);
        var calendarTab = element(by.linkText('Calendar'))
        browser.wait(EC.visibilityOf(calendarTab), 5000, 'calendar is not displayed on the dom').then(function () {
            logging.log("Navigating to a protected route without a signed-in user");
            return calendarTab.click();
        }).then(function () {
            return browser.wait(urlChanged(settings.appUrl), 1000);
        }).then(function () {
            logging.log("User gets redirected to the sign-in page");
            browser.sleep(2000);
            return enterCredentials(settings.assignedUser, settings.password);
        }).then(function () {
            return validateCache([settings.clientID]);
        }).then(function () {
            expect(browser.getCurrentUrl()).toMatch(settings.appUrl + 'myCalendar');
            logging.log("login start page is saved with the url of the protected route");
            expect(getValueLocalStorage(Storage.LOGIN_REQUEST)).toEqual(settings.appUrl + 'myCalendar');
            browser.sleep(1000);
            expect(getAccessToken(settings.calendarScope)).not.toBeNull();
            return;
        }).then(function () {
            return logout();
        }).then(function () {
            browser.sleep(1000);
            expect(getValueLocalStorage(Storage.IDTOKEN)).toEqual('');
            expect(getAccessToken()).toBeNull();
            return;
        });
    });

    var spec5 = it('5 :: should login using popup flow, navigate to calendar tab and check if token is served from the cache', function () {
        logging.log(spec5.description, false);
        logging.log("Start of Test");
        browser.sleep(2000);
        var loginButton = element(by.id('loginPopupButton'));
        var mainWindow = null, popUpWindow = null;
        browser.wait(EC.visibilityOf(loginButton), 5000, 'Login button is not displayed on the dom').then(function () {
            return loginButton.click();
        }).then(function () {
            return browser.getAllWindowHandles();
        }).then(function (handles) {
            browser.sleep(2000);
            expect(handles.length).toEqual(2);
            mainWindow = handles[0];
            popUpWindow = handles[1];
            return browser.switchTo().window(popUpWindow);
        }).then(function () {
            return enterCredentials(settings.assignedUser, settings.password);
        }).then(function () {
            return browser.switchTo().window(mainWindow);
        }).then(function () {
            browser.sleep(1000);
            return validateCache([settings.clientID]);
        }).then(function() {
            logging.log("Popup window is closed after successful login");
            expect(getAccessToken(settings.clientID)).not.toBeNull();
            logging.log("Sending request to MS Graph api");
            return element(by.linkText('Calendar')).click();
        }).then(function () {
            return browser.wait(urlChanged(settings.appUrl), 1000, 'Navigation from root page to Calendar failed');
        }).then(function () {
            expect(browser.getCurrentUrl()).toMatch(settings.appUrl + 'myCalendar');
            browser.sleep(1000);
            expect(getAccessToken(settings.calendarScope)).not.toBeNull();
            return;
        }).then(function () {
            return logout();
        }).then(function () {
            browser.sleep(2000);
            expect(getValueLocalStorage(Storage.IDTOKEN)).toEqual('');
            expect(getAccessToken()).toBeNull();
        });
    });


    var spec6 = it('6 :: should navigate to Home page, enter text in a textbox, log in using redirect flow and check if textbox text gets cleared as app gets reloaded', function () {
        logging.log(spec6.description, false);
        logging.log("Start of Test");
        browser.sleep(2000);
        browser.driver.manage().deleteAllCookies().then(function () {
            var homeButton = element(by.linkText('Home'));
            homeButton.click().then(function () {
                return browser.wait(urlChanged(settings.appUrl), 1000);
            }).then(function () {
                browser.sleep(2000);
                var homePageTextBox = element(by.id("homePageTextBox"));
                return browser.wait(EC.visibilityOf(homePageTextBox), 5000);
            }).then(function () {
                logging.log("Entering text in a textbox on the home page");
                var homePageTextBox = element(by.id("homePageTextBox"));
                homePageTextBox.sendKeys("Initial State");
                expect(homePageTextBox.getAttribute('value')).toEqual("Initial State");
                return;
            }).then(function () {
                var loginRedirectButton = element(by.id('loginRedirectButton'));
                return browser.wait(EC.visibilityOf(loginRedirectButton), 5000, 'Login button is not displayed on the dom');
            }).then(function () {
                var loginRedirectButton = element(by.id('loginRedirectButton'));
                return loginRedirectButton.click();
            }).then(function () {
                return browser.getAllWindowHandles();
            }).then(function (handles) {
                expect(handles.length).toEqual(1);
                 return;
            }).then(function () {
                browser.sleep(3000);
                return enterCredentials(settings.assignedUser, settings.password);
            }).then(function () {
                browser.sleep(1000);
                return validateCache([settings.clientID]);
            }).then(function(){
                var homePageTextBox = element(by.id("homePageTextBox"));
                expect(homePageTextBox.getAttribute('value')).toEqual("");
                logging.log("App is reloaded in case of login using a redirect");
                return logout();
            }).then(function () {
                browser.sleep(2000);
                expect(getValueLocalStorage(Storage.IDTOKEN)).toEqual('');
            });
        });
    });

    var spec7 = it('7 :: should navigate to Home page, enter text in a textbox, log in using popUp and check if textbox text is retained as app does not get reloaded', function () {
        logging.log(spec7.description, false);
        logging.log("Start of Test");
        browser.sleep(2000);
        var homeButton = element(by.linkText('Home'));
        var mainWindow = null, popUpWindow = null;
        homeButton.click().then(function () {
            return browser.wait(urlChanged(settings.appUrl), 1000);
        }).then(function () {
            browser.sleep(2000);
            var homePageTextBox = element(by.id("homePageTextBox"));
            return browser.wait(EC.visibilityOf(homePageTextBox), 5000);
        }).then(function () {
            logging.log("Entering text in a textbox on the home page");
            var homePageTextBox = element(by.id("homePageTextBox"));
            homePageTextBox.sendKeys("Initial State");
            expect(homePageTextBox.getAttribute('value')).toEqual("Initial State");
        }).then(function () {
            var loginPopupButton = element(by.id('loginPopupButton'));
            return browser.wait(EC.visibilityOf(loginPopupButton), 5000, 'Login button is not displayed on the dom');
        }).then(function () {
            var loginPopupButton = element(by.id('loginPopupButton'));
            return loginPopupButton.click();
        }).then(function () {
            return browser.getAllWindowHandles();
        }).then(function (handles) {
            expect(handles.length).toEqual(2);
            mainWindow = handles[0];
            popUpWindow = handles[1];
            return browser.switchTo().window(popUpWindow);
        }).then(function () {
            browser.sleep(3000);
            return enterCredentials(settings.assignedUser, settings.password);
        }).then(function () {
            return browser.switchTo().window(mainWindow);
        }).then(function () {
            browser.sleep(1000);
            return validateCache([settings.clientID]);
        }).then(function()
        {
            var homePageTextBox = element(by.id("homePageTextBox"));
            expect(homePageTextBox.getAttribute('value')).toEqual("Initial State");
            logging.log("App is not reloaded in case of login using a popUp window");
            return logout();
        }).then(function () {
            browser.sleep(3000);
            expect(getValueLocalStorage(Storage.IDTOKEN)).toEqual('');
        });
    });

});
