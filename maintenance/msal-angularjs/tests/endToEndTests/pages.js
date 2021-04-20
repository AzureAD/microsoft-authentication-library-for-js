var logging = require('./logging');
var config = require('./config');
var _this;
var EC = protractor.ExpectedConditions;

class Pages {

    constructor() {
        _this = this;
    }

    signInPage() {
        return function () {
            return browser.getTitle().then(function (title) {
                return title === 'Sign in to your account';
            });
        }
    };

    homePage() {
        return function () {
            return browser.getTitle().then(function (title) {
                return title === 'Todo List: a SPA sample demonstrating Azure AD and MSAL JS';
            });
        }
    };

    clickTodoPage() {
        var todoButton = element(by.xpath("//a[@ui-sref='TodoList']"));
        logging.log("Navigating to Todo Page");
        return todoButton.click().then(function () {
            browser.sleep(6000);
            return browser.wait(_this.urlChanged(config.appUrl), 1000, 'Navigation to TodoList page failed')
        }).then(function () {
            expect(browser.getCurrentUrl()).toMatch(config.appUrl + '/#/TodoList');
            var addButton = element(by.id('addButton'));
            return browser.wait(EC.visibilityOf(addButton), 10000, 'Add ToDo button not visible on the dom');
        });
    }

    clickHomePage() {
        var homeButton = element(by.xpath("//a[@ui-sref='Home']"));
        logging.log("Navigating to Home Page");
        return homeButton.click().then(function () {
            browser.sleep(6000);
            return browser.wait(_this.urlChanged(config.appUrl), 1000, 'Navigation to Home page failed')
        }).then(function () {
            expect(browser.getCurrentUrl()).toMatch(config.appUrl + '/#/Home');
        });
    }

    urlChanged(oldUrl) {
        return function () {
            return browser.getCurrentUrl().then(function (newUrl) {
                return oldUrl != newUrl;
            });
        };
    };
};

module.exports = new Pages();  