var assert = require('assert'),
  fs = require('fs');

var configFilename = process.argv[3];
var configFile = require('../'+configFilename);
var config = configFile.config;

var webdriver = require('selenium-webdriver');

describe('Google Search', function() {
  var driver, server;

  beforeEach(function() {
  console.log("Before");
  driver = new webdriver.Builder().
    usingServer('http://hub-cloud.browserstack.com/wd/hub').
    withCapabilities(config.capabilities).
    build();

  });

  afterEach(function() {
    console.log("After");
    driver.quit();
    });

  it("sample test", async function() {
      //expect(true).toBe(true);
      await driver.get('http://www.google.com');
      await driver.findElement(webdriver.By.name('q')).sendKeys('BrowserStack\n');
      //await driver.findElement(webdriver.By.name('btnK')).click();
      var title = await driver.getTitle().then(function(title) {
          console.log(title);
          //done();
      });
    }).timeout(20000);

});