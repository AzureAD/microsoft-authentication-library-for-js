var webdriver = require('selenium-webdriver');

var configFile = process.argv[2];
var config = require('../'+configFile);

var configurationFiles = [
   "se.conf.chrome.js"
];

describe('Selenium Example', function() {
    beforeEach(function(done) {
        var configFile = configurationFiles[i];
        this.driver = new webdriver.Builder().usingServer('http://hub-cloud.browserstack.com/wd/hub').withCapabilities(config.capabilities).build();
        this.driver.get('http://www.google.com').then(done);
    });

    afterEach(function(done) {
        this.driver.quit().then(done);
    });

    it('Find title', function(done) {
        var element = this.driver.findElement(webdriver.By.name('q'));
        element.sendKeys('BrowserStack\n').then(function() {
            driver.getTitle().then(function(title) {
                expect(title).toBe('BrowserStack - Google Search');
                done();
            });
        });
    });
});