var logging = require('./logging');
var localStorage = require('./localStorage');
var helpers = require('./helpers');
var settings = require('./config');
var Storage = require('./constants');

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

    var log = function (message) {
        console.log(message);
    }

    var EC = protractor.ExpectedConditions;

    var spec1 = it('1:: Should login using redirect flow and logout', function () {
        logging.log(spec1.description, false);
        logging.log("Start of Test");
        var loginRedirectButton = element(by.id('loginRedirectButton'));
        browser.wait(EC.visibilityOf(loginRedirectButton), 5000, 'Login button is not displayed on the dom').then(function () {
            return loginRedirectButton.click();
        }).then(function () {
            return browser.wait(helpers.signInPage(), 5000, 'Error navigating to Signin Page');
        }).then(function () {
            return helpers.enterCredentials(settings.assignedUser, settings.password);
        }).then(function () {
            return helpers.validateCache([settings.clientID]);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            logging.log("Sign in Success");
            return helpers.logout();
        }).then(function () {
            logging.log("Logout button clicked");
            logging.log("Redirecting back to Home page after Logout");
            return browser.wait(helpers.homePage(), 10000, 'Error navigating to home page after Logout');
        }).then(function () {
            logging.log("Verifying if Msal cache entries are reset")
            return helpers.validateLogout()
        }).then(function () {
            logging.log("Log out Success");
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
            return helpers.enterCredentials(settings.assignedUser, settings.password);
        }).then(function () {
            return browser.switchTo().window(mainWindow);
        }).then(function () {
            browser.sleep(1000);
            return helpers.validateCache([settings.clientID]);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            logging.log("Sign in Success");
            return helpers.logout();
        }).then(function () {
            logging.log("Logout button clicked");
            logging.log("Redirecting back to Home page after Logout");
            return browser.wait(helpers.homePage(), 10000, 'Error navigating to home page after Logout');
        }).then(function () {
            logging.log("Verifying if Msal cache entries are reset");
            return helpers.validateLogout();
        }).then(function () {
            logging.log("Log out Success");
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
            return browser.wait(helpers.signInPage(), 5000, 'Error navigating to Signin Page');
        }).then(function () {
            return helpers.enterCredentials(settings.assignedUser, settings.password);
        }).then(function () {
            return helpers.validateCache([settings.clientID]);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            logging.log("Sign in Success");
            logging.log("Calling MS Graph API");
            return element(by.linkText('Calendar')).click();
        }).then(function () {
            return browser.wait(helpers.urlChanged(settings.appUrl), 1000, 'Navigation from root page to Calendar Tab failed');
        }).then(function () {
            return expect(browser.getCurrentUrl()).toMatch(settings.appUrl + 'myCalendar');
        }).then(function () {
            browser.sleep(2000);
            return helpers.validateCache(settings.calendarScope);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            return helpers.logout();
        }).then(function () {
            logging.log("Logout button clicked");
            logging.log("Redirecting back to Home page after Logout");
            return browser.wait(helpers.homePage(), 10000, 'Error navigating to home page after Logout');
        }).then(function () {
            logging.log("Verifying if Msal cache entries are resetted");
            return helpers.validateLogout();
        }).then(function () {
            logging.log("Log out Success");
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
            return browser.wait(helpers.urlChanged(settings.appUrl), 1000);
        }).then(function () {
            logging.log("User gets redirected to the sign-in page");
            browser.sleep(2000);
            return helpers.enterCredentials(settings.assignedUser, settings.password);
        }).then(function () {
            return helpers.validateCache([settings.clientID]);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            expect(browser.getCurrentUrl()).toMatch(settings.appUrl + 'myCalendar');
            logging.log("login start page is saved with the url of the protected route");
            expect(localStorage.getValue(Storage.LOGIN_REQUEST)).toEqual(settings.appUrl + 'myCalendar');
            return;
        }).then(function () {
            browser.sleep(2000);
            return helpers.validateCache(settings.calendarScope);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            return helpers.logout();
        }).then(function () {
            logging.log("Logout button clicked");
            logging.log("Redirecting back to Home page after Logout");
            return browser.wait(helpers.homePage(), 10000, 'Error navigating to home page after Logout');
        }).then(function () {
            logging.log("Verifying if Msal cache entries are resetted");
            return helpers.validateLogout();
        }).then(function () {
            logging.log("Log out Success");
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
            return helpers.enterCredentials(settings.assignedUser, settings.password);
        }).then(function () {
            return browser.switchTo().window(mainWindow);
        }).then(function () {
            browser.sleep(2000);
            return helpers.validateCache([settings.clientID]);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            logging.log("Popup window is closed after successful login");
            logging.log("Sending request to MS Graph api");
            return element(by.linkText('Calendar')).click();
        }).then(function () {
            return browser.wait(helpers.urlChanged(settings.appUrl), 1000, 'Navigation from root page to Calendar failed');
        }).then(function () {
            return expect(browser.getCurrentUrl()).toMatch(settings.appUrl + 'myCalendar');
        }).then(function () {
            browser.sleep(2000);
            return helpers.validateCache(settings.calendarScope);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            return helpers.logout();
        }).then(function () {
            logging.log("Logout button clicked");
            logging.log("Redirecting back to Home page after Logout");
            return browser.wait(helpers.homePage(), 10000, 'Error navigating to home page after Logout');
        }).then(function () {
            logging.log("Verifying if Msal cache entries are resetted");
            return helpers.validateLogout();
        }).then(function () {
            logging.log("Log out Success");
        });
    });

    var spec6 = it('6 :: should navigate to Home page, enter text in a textbox, log in using redirect flow and check if textbox text gets cleared as app gets reloaded', function () {
        logging.log(spec6.description, false);
        logging.log("Start of Test");
        browser.sleep(2000);
        browser.driver.manage().deleteAllCookies().then(function () {
            var homeButton = element(by.linkText('Home'));
            homeButton.click().then(function () {
                return browser.wait(helpers.urlChanged(settings.appUrl), 1000);
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
                return helpers.enterCredentials(settings.assignedUser, settings.password);
            }).then(function () {
                browser.sleep(1000);
                return helpers.validateCache([settings.clientID]);
            }).then(function (accessTokenKey) {
                expect(accessTokenKey).not.toBeNull();
                var homePageTextBox = element(by.id("homePageTextBox"));
                expect(homePageTextBox.getAttribute('value')).toEqual("");
                logging.log("App is reloaded in case of login using a redirect");
                return helpers.logout();
            }).then(function () {
                logging.log("Logout button clicked");
                logging.log("Redirecting back to Home page after Logout");
                return browser.wait(helpers.homePage(), 10000, 'Error navigating to home page after Logout');
            }).then(function () {
                logging.log("Verifying if Msal cache entries are reset");
                return helpers.validateLogout();
            }).then(function () {
                logging.log("Log out Success");
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
            return browser.wait(helpers.urlChanged(settings.appUrl), 1000);
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
            return helpers.enterCredentials(settings.assignedUser, settings.password);
        }).then(function () {
            return browser.switchTo().window(mainWindow);
        }).then(function () {
            browser.sleep(1000);
            return helpers.validateCache([settings.clientID]);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            var homePageTextBox = element(by.id("homePageTextBox"));
            expect(homePageTextBox.getAttribute('value')).toEqual("Initial State");
            logging.log("App is not reloaded in case of login using a popUp window");
            return helpers.logout();
        }).then(function () {
            logging.log("Logout button clicked");
            logging.log("Redirecting back to Home page after Logout");
            return browser.wait(helpers.homePage(), 10000, 'Error navigating to home page after Logout');
        }).then(function () {
            logging.log("Verifying if Msal cache entries are reset");
            return helpers.validateLogout();
        }).then(function () {
            logging.log("Log out Success");
        });
    });

    var spec8 = it('8 :: Should login using redirect flow, navigate to external we api and check if token is served from the cache', function () {
        logging.log(spec8.description, false);
        logging.log("Start of Test");
        browser.sleep(2000);
        var loginRedirectButton = element(by.id('loginRedirectButton'));
        browser.wait(EC.visibilityOf(loginRedirectButton), 5000, 'Login button is not displayed on the dom').then(function () {
            return loginRedirectButton.click();
        }).then(function () {
            return browser.wait(helpers.signInPage(), 5000, 'Error navigating to Signin Page');
        }).then(function () {
            return helpers.enterCredentials(settings.assignedUser, settings.password);
        }).then(function () {
            return helpers.validateCache([settings.clientID]);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            logging.log("Calling external web api");
            return element(by.linkText('Web API Call')).click();
        }).then(function () {
            return browser.wait(helpers.urlChanged(settings.appUrl), 1000, 'Navigation from root page to Calendar Tab failed');
        }).then(function () {
            expect(browser.getCurrentUrl()).toMatch(settings.appUrl + 'todoList');
            return;
        }).then(function () {
            browser.sleep(2000);
            return helpers.validateCache(settings.externalAPIScope);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            return helpers.logout();
        }).then(function () {
            logging.log("Logout button clicked");
            logging.log("Redirecting back to Home page after Logout");
            return browser.wait(helpers.homePage(), 10000, 'Error navigating to home page after Logout');
        }).then(function () {
            logging.log("Verifying if Msal cache entries are resetted");
            return helpers.validateLogout();
        }).then(function () {
            logging.log("Log out Success");
        });
    });

    var spec9 = it('9 :: should navigate to a protected route(external web api) using redirect flow and check if user gets redirected to the login page. After successful authentication, user should get redirected back to the protected route', function () {
        logging.log(spec9.description, false);
        logging.log("Start of Test");
        browser.sleep(2000);
        var todoTab = element(by.linkText('Web API Call'));
        browser.wait(EC.visibilityOf(todoTab), 5000, 'todo tab is not displayed on the dom').then(function () {
            logging.log("Navigating to a protected route without a signed-in user");
            return todoTab.click();
        }).then(function () {
            return browser.wait(helpers.urlChanged(settings.appUrl), 1000);
        }).then(function () {
            logging.log("User gets redirected to the sign-in page");
            browser.sleep(2000);
            return helpers.enterCredentials(settings.assignedUser, settings.password);
        }).then(function () {
            return helpers.validateCache([settings.clientID]);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            expect(browser.getCurrentUrl()).toMatch(settings.appUrl + 'todoList');
            logging.log("login start page is saved with the url of the protected route");
            expect(localStorage.getValue(Storage.LOGIN_REQUEST)).toEqual(settings.appUrl + 'todoList');
            browser.sleep(1000);
            return helpers.validateCache(settings.externalAPIScope);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            return helpers.logout();
        }).then(function () {
            logging.log("Logout button clicked");
            logging.log("Redirecting back to Home page after Logout");
            return browser.wait(helpers.homePage(), 10000, 'Error navigating to home page after Logout');
        }).then(function () {
            logging.log("Verifying if Msal cache entries are resetted");
            return helpers.validateLogout();
        }).then(function () {
            logging.log("Log out Success");
        });
    });


    var spec10 = it('10 :: Should login using redirect flow and MSA account, navigate to external we api and check if token is served from the cache', function () {
        logging.log(spec10.description, false);
        logging.log("Start of Test");
        browser.sleep(2000);
        var loginRedirectButton = element(by.id('loginRedirectButton'));
        browser.wait(EC.visibilityOf(loginRedirectButton), 5000, 'Login button is not displayed on the dom').then(function () {
            return loginRedirectButton.click();
        }).then(function () {
            return browser.wait(helpers.signInPage(), 5000, 'Error navigating to Signin Page');
        }).then(function () {
            return helpers.enterCredentials(settings.MSAUser, settings.MSAPassword);
        }).then(function () {
            return helpers.validateCache([settings.clientID]);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            logging.log("Calling external web api");
            return element(by.linkText('Web API Call')).click();
        }).then(function () {
            return browser.wait(helpers.urlChanged(settings.appUrl), 1000, 'Navigation from root page to Calendar Tab failed');
        }).then(function () {
            return expect(browser.getCurrentUrl()).toMatch(settings.appUrl + 'todoList');
        }).then(function () {
            browser.sleep(5000);
            return helpers.validateCache(settings.externalAPIScope);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            browser.sleep(2000);
            return helpers.logout();
        });
    });

    var spec11 = it('11 :: Should login using redirect flow and MSA account, navigate to MS Graph and check if token is served from the cache', function () {
        logging.log(spec11.description, false);
        logging.log("Start of Test");
        browser.sleep(2000);
        var loginRedirectButton = element(by.id('loginRedirectButton'));
        browser.wait(EC.visibilityOf(loginRedirectButton), 5000, 'Login button is not displayed on the dom').then(function () {
            return loginRedirectButton.click();
        }).then(function () {
            return browser.wait(helpers.signInPage(), 5000, 'Error navigating to Signin Page');
        }).then(function () {
            return helpers.enterCredentials(settings.MSAUser, settings.MSAPassword);
        }).then(function () {
            return helpers.validateCache([settings.clientID]);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            logging.log("Calling ms graph");
            return element(by.linkText('Calendar')).click();
        }).then(function () {
            return browser.wait(helpers.urlChanged(settings.appUrl), 1000, 'Navigation from root page to Calendar Tab failed');
        }).then(function () {
            return expect(browser.getCurrentUrl()).toMatch(settings.appUrl + 'myCalendar');
        }).then(function () {
            browser.sleep(2000);
            return helpers.validateCache(settings.calendarScope);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            logging.log(accessTokenKey);
            browser.sleep(2000);
            return helpers.logout();
        })
    });

    var spec12 = it('12 :: Should login using redirect flow, remove expiration key for todo api access_token to 0, navigate to Todo page and check if token is renewed using iframe', function () {
        logging.log(spec12.description, false);
        logging.log("Start of Test");
        browser.sleep(3000);
        var key = '';

        logging.log(spec12.description, false);
        logging.log("Start of Test");
        var loginRedirectButton = element(by.id('loginRedirectButton'));
        browser.wait(EC.visibilityOf(loginRedirectButton), 5000, 'Login button is not displayed on the dom').then(function () {
            return loginRedirectButton.click();
        }).then(function () {
            return browser.wait(helpers.signInPage(), 5000, 'Error navigating to Signin Page');
        }).then(function () {
            return helpers.enterCredentials(settings.assignedUser, settings.password);
        }).then(function () {
            logging.log("Calling external web api");
            return element(by.linkText('Web API Call')).click();
        }).then(function () {
            return browser.wait(helpers.urlChanged(settings.appUrl), 1000, 'Navigation from root page to Calendar Tab failed');
        }).then(function () {
            return expect(browser.getCurrentUrl()).toMatch(settings.appUrl + 'todoList');
        }).then(function () {
            browser.sleep(2000);
            return helpers.validateCache(settings.externalAPIScope);
        }).then(function (accessTokenKey) {
            expect(accessTokenKey).not.toBeNull();
            logging.log("Removing accessToken key for Todo API");
            key = JSON.stringify(accessTokenKey);
            return localStorage.removeValue(key);
        }).then(function () {
            expect(localStorage.getValue(key)).toEqual(null);
            logging.log("Access token key deleted from cache");
            var homeButton = element(by.linkText('Home'));
            homeButton.click().then(function () {
                return browser.wait(helpers.homePage(), 5000, 'Error navigating to Home page');
            }).then(function () {
                var todoTab = element(by.linkText('Web API Call'));
                return todoTab.click();
            }).then(function () {
                browser.sleep(2000);
                return helpers.validateCache(settings.externalAPIScope);
            }).then(function (accessTokenKey) {
                expect(accessTokenKey).not.toBeNull();
                return helpers.logout();
            }).then(function () {
                logging.log("Logout button clicked");
                logging.log("Redirecting back to Home page after Logout");
                return browser.wait(helpers.homePage(), 10000, 'Error navigating to home page after Logout');
            }).then(function () {
                logging.log("Verifying if Msal cache entries are resetted")
                return helpers.validateLogout()
            }).then(function () {
                logging.log("Log out Success");
            });
        });
    });

});
