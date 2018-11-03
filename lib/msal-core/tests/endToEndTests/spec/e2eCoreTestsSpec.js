var assert = require('assert'),
  fs = require('fs');

var helpers = require('../helpers')

var configFilename = process.argv[3];
var configFile = require('../'+configFilename);
var config = configFile.config;

var webdriver = require('selenium-webdriver');

describe('E2E Tests MSAL Core', function() {
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

  it("1:: should login using popup and logout", async function() {
        //expect(true).toBe(true);
        await driver.get('https://msaljssampleapp-pk.azurewebsites.net/JavascriptSPA');
        await driver.findElement(webdriver.By.id('SignIn')).click();

        var parentWindow = await driver.getWindowHandle();
        var handles = await driver.getAllWindowHandles();

        for(let handle of handles) {
            if(parentWindow === handle) {
                console.log("Parent window");
            } else {
                await driver.switchTo().window(handle);
                await helpers.login(driver, 'test@pkanherkar.onmicrosoft.com', 'pass1@#$');
                handles = await driver.getAllWindowHandles();
                if(handles.length > 1) {
                    console.log("login failed");
                } else {
                    await driver.switchTo().window(parentWindow);
                }
            }
        }

        var body = await driver.findElement(webdriver.By.id("json"));
        count = 0;
        var bodyText = "";
        while(!bodyText) {
            if(count > 2) {
                break;
            }
            await body.getText().then(function(text) {
                bodyText = text;
            });
            driver.sleep(2500);
            count++;
        }

        assert.ok(bodyText.includes('test@pkanherkr.onmicrosoft.com'));

        //await driver.findElement(webdriver.By.name('btnK')).click();
//        var title = await driver.getTitle().then(function(title) {
//            console.log(title);
//            //done();
//        });
      }).timeout(120000);
      // include catch for any errors, so that tests don't error out, but still show failures

});