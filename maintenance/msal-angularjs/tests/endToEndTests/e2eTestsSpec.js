var config = require('./config');
var helpers = require('./helpers');
var pages = require('./pages');
var signInModule = require('./signInModule');
var logging = require('./logging');
var localStorage = require('./localStorage');
var EC = protractor.ExpectedConditions;

describe('E2E tests', function () {

    beforeAll(function () {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 120000;
        browser.ignoreSynchronization = true;
        browser.manage().deleteAllCookies();
    });

    beforeEach(function () {
        console.log('');
        browser.get(config.appUrl);
    });

    afterEach(function () {
        browser.get(config.appUrl);
        logging.log("End of Test");
        logging.count = 1;
        console.log('');
    });

    var spec1 = it('1: Should login using redirect flow and logout', function () {
        logging.log(spec1.description, false);
        logging.log("Start of Test");
        browser.sleep(3000);
        signInModule.login().then(function () {
            return signInModule.checkLoginState(config.assignedUser, config.password);
        }).then(function () {
            return browser.wait(pages.homePage(), 5000, 'Error navigating to home page after sign-in');
        }).then(function () {
            return helpers.validateCache([config.clientID]);
        }).then(function (accessTokenKey) {
            logging.log(accessTokenKey);
            logging.log("Sign in Success");
            return signInModule.logout();
        }).then(function () {
            logging.log("Logout button clicked");
            logging.log("Redirecting back to Home page after Logout");
            return browser.wait(pages.homePage(), 10000, 'Error navigating to home page after Logout');
        }).then(function () {
            logging.log("Verifying if Msal cache entries are resetted")
            return helpers.validateLogout()
        }).then(function () {
            logging.log("Log out Success");
        });
    });

    var spec2 = it('2: Should login using Popup and logout', function () {
        logging.log(spec2.description, false);
        logging.log("Start of Test");
        browser.sleep(3000);
        browser.executeScript("return window.popUp=true;").then(function () {
            return signInModule.login();
        }).then(function () {
            logging.log("Opened popup window for Login");
            return browser.getAllWindowHandles();
        }).then(function (handles) {
            expect(handles.length).toEqual(2);
            mainWindow = handles[0];
            popUpWindow = handles[1];
            return browser.switchTo().window(popUpWindow);
        }).then(function () {
            return signInModule.checkLoginState(config.assignedUser, config.password);
        }).then(function () {
            return browser.switchTo().window(mainWindow);
        }).then(function () {
            browser.sleep(1000);
            return helpers.validateCache([config.clientID]);
        }).then(function (accessTokenKey) {
            logging.log(accessTokenKey);
            logging.log("Sign in Success");
            return signInModule.logout();
        }).then(function () {
            logging.log("Logout button clicked");
            return browser.executeScript("return window.popUp=false;");
        }).then(function () {
            logging.log("Redirecting back to Home page after Logout");
            return browser.wait(pages.homePage(), 10000, 'Error navigating to home page after Logout');
        }).then(function () {
            logging.log("Verifying if Msal cache entries are resetted")
            return helpers.validateLogout()
        }).then(function () {
            logging.log("Log out Success");
        });
    });

    var spec3 = it('3: Should login using redirect flow, navigate to Todo page (external API) and check if token is served from the cache', function () {
        logging.log(spec3.description, false);
        logging.log("Start of Test");
        browser.sleep(3000);
        signInModule.login().then(function () {
            return signInModule.checkLoginState(config.assignedUser, config.password);
        }).then(function () {
            return browser.wait(pages.homePage(), 5000, 'Error navigating to home page after sign-in');
        }).then(function () {
            return helpers.validateCache([config.clientID]);
        }).then(function () {
            return pages.clickTodoPage();
        }).then(function () {
            return helpers.validateCache(config.apiScopes);
        }).then(function (accessTokenKey) {
            logging.log(accessTokenKey);
            return signInModule.logout();
        }).then(function () {
            logging.log("Logout button clicked");
            logging.log("Redirecting back to Home page after Logout");
            return browser.wait(pages.homePage(), 10000, 'Error navigating to home page after Logout');
        }).then(function () {
            logging.log("Verifying if Msal cache entries are resetted")
            return helpers.validateLogout()
        }).then(function () {
            logging.log("Log out Success");
        });
    });

    var spec4 = it('4: Should login using redirect flow, navigate to Calendar page (Graph API) and check if token is served from the cache', function () {
        logging.log(spec4.description, false);
        logging.log("Start of Test");
        browser.sleep(3000);
        signInModule.login().then(function () {
            return signInModule.checkLoginState(config.assignedUser, config.password);
        }).then(function () {
            return browser.wait(pages.homePage(), 5000, 'Error navigating to home page after sign-in');
        }).then(function () {
            return helpers.validateCache([config.clientID]);
        }).then(function (accessTokenKey) {
            logging.log(accessTokenKey);
            var calendarButton = element(by.xpath("//a[@ui-sref='Calendar']"));
            logging.log("Navigating to Calendar Page");
            return calendarButton.click();
        }).then(function () {
            browser.sleep(6000);
            return browser.wait(pages.urlChanged(config.appUrl), 1000, 'Navigation from root page to Calendar failed');
        }).then(function () {
            expect(browser.getCurrentUrl()).toMatch(config.appUrl + '/#/Calendar');
            var contactInfo = element(by.id('contactInfo'));
            return browser.wait(EC.visibilityOf(contactInfo), 10000, 'Contact info is not visible on the dom');
        }).then(function () {
            return helpers.validateCache(config.graphScopes);
        }).then(function () {
            return signInModule.logout();
        }).then(function () {
            logging.log("Logout button clicked");
            logging.log("Redirecting back to Home page after Logout");
            return browser.wait(pages.homePage(), 10000, 'Error navigating to home page after Logout');
        }).then(function () {
            logging.log("Verifying if Msal cache entries are resetted")
            return helpers.validateLogout()
        }).then(function () {
            logging.log("Log out Success");
        });
    });

    var spec5 = it('5: Should login using redirect flow, remove expiration key for todo api access_token to 0, navigate to Todo page and check if token is renewed using iframe', function () {
        logging.log(spec5.description, false);
        logging.log("Start of Test");
        browser.sleep(3000);
        var key = '';
        signInModule.login().then(function () {
            return signInModule.checkLoginState(config.assignedUser, config.password);
        }).then(function () {
            return browser.wait(pages.homePage(), 5000, 'Error navigating to Home page after sign-in');
        }).then(function () {
            return helpers.validateCache([config.clientID]);
        }).then(function (accessTokenKey) {
            logging.log(accessTokenKey);
            return pages.clickTodoPage();
        }).then(function () {
            return helpers.validateCache(config.apiScopes);
        }).then(function (accessTokenKey) {
            logging.log(accessTokenKey);
            logging.log("Removing accessToken key for Todo API");
            key = JSON.stringify(accessTokenKey);
            return localStorage.removeValue(key);
        }).then(function () {
            expect(localStorage.getValue(key)).toEqual(null);
            logging.log("Access token key deleted from cache");
            return browser.wait(pages.clickHomePage(), 5000, 'Error navigating to Home page');
        }).then(function () {
            return pages.clickTodoPage();
        }).then(function () {
            return helpers.validateCache(config.apiScopes);
        }).then(function (accessTokenKey) {
            logging.log(accessTokenKey);
            return signInModule.logout();
        }).then(function () {
            logging.log("Logout button clicked");
            logging.log("Redirecting back to Home page after Logout");
            return browser.wait(pages.homePage(), 10000, 'Error navigating to home page after Logout');
        }).then(function () {
            logging.log("Verifying if Msal cache entries are resetted")
            return helpers.validateLogout()
        }).then(function () {
            logging.log("Log out Success");
        });
    });

    var spec6 = it('6: Should navigate to TodoPage without signing in and check if user is prompted for login using redirect fLow followed by acquire token request to Todo api to retrieve an access_token', function () {
        logging.log(spec6.description, false);
        logging.log("Start of Test");
        browser.sleep(3000);
        var todoButton = element(by.xpath("//a[@ui-sref='TodoList']"));
        logging.log("Navigating to Todo Page");
        return todoButton.click().then(function () {
            return browser.wait(pages.urlChanged(config.appUrl), 5000, 'Navigation to Login Page failed');
        }).then(function () {
            return signInModule.checkLoginState(config.assignedUser, config.password);
        }).then(function () {
            browser.sleep(10000);
            expect(browser.getCurrentUrl()).toMatch(config.appUrl + '/#/TodoList');
            return helpers.validateCache([config.clientID]);
        }).then(function (accessTokenKey) {
            logging.log(accessTokenKey);
            return helpers.validateCache(config.apiScopes);
        }).then(function (accessTokenKey) {
            return signInModule.logout();
        }).then(function () {
            logging.log("Logout button clicked");
            logging.log("Redirecting back to Home page after Logout");
            return browser.wait(pages.homePage(), 10000, 'Error navigating to home page after Logout');
        }).then(function () {
            logging.log("Verifying if Msal cache entries are resetted")
            return helpers.validateLogout()
        }).then(function () {
            logging.log("Log out Success");
        });
    });

    var spec7 = it('7: Should save some state (text) on the Home page, login using popup window and check if the Home page is not reloaded and state is retained', function () {
        logging.log(spec7.description, false);
        logging.log("Start of Test");
        browser.sleep(3000);
        var homePageTextBox;
        return pages.clickHomePage().then(function () {
            return browser.wait(pages.urlChanged(config.appUrl), 5000, 'Navigation to Login Page failed');
        }).then(function () {
            homePageTextBox = element(by.id("homePageTextBox"));
            return browser.wait(EC.visibilityOf(homePageTextBox), 5000);
        }).then(function () {
            logging.log("Saving initial state on the Home page")
            homePageTextBox.sendKeys("Initial State");
            expect(homePageTextBox.getAttribute('value')).toEqual("Initial State");
            return browser.executeScript("return window.popUp=true;");
        }).then(function () {
            return signInModule.login();
        }).then(function () {
            logging.log("Opened popup window for Login");
            return browser.getAllWindowHandles();
        }).then(function (handles) {
            expect(handles.length).toEqual(2);
            mainWindow = handles[0];
            popUpWindow = handles[1];
            return browser.switchTo().window(popUpWindow);
        }).then(function () {
            return signInModule.checkLoginState(config.assignedUser, config.password);
        }).then(function () {
            return browser.switchTo().window(mainWindow);
        }).then(function () {
            browser.sleep(1000);
            return helpers.validateCache([config.clientID]);
        }).then(function (accessTokenKey) {
            logging.log(accessTokenKey);
            logging.log("Sign in Success");
            expect(homePageTextBox.getAttribute('value')).toEqual("Initial State");
            logging.log("State saved on the Home page is preserved after login");
            return signInModule.logout();
        }).then(function () {
            logging.log("Logout button clicked");
            return browser.executeScript("return window.popUp=false;");
        }).then(function () {
            logging.log("Redirecting back to Home page after Logout");
            return browser.wait(pages.homePage(), 10000, 'Error navigating to home page after Logout');
        }).then(function () {
            logging.log("Verifying if Msal cache entries are resetted")
            return helpers.validateLogout()
        }).then(function () {
            logging.log("Log out Success");
        });
    });

   
});
