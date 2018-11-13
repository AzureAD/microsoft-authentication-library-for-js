var chai = require('chai');
//var assert = chai.assert;
var expect = chai.expect;

var helpers = require('../helpers');
var localStorage = require('../localStorage');

var configFilename = process.argv[3];
var configFile = require('../'+configFilename);
var config = configFile.config;

var settings = require('../config');
var constants = require('../constants');

var webdriver = require('selenium-webdriver');

describe('E2E Tests MSAL Core', function() {
  var driver, server;

    beforeEach(function() {
        console.log("Start of Test");
        driver = new webdriver.Builder().
        usingServer('http://hub-cloud.browserstack.com/wd/hub').
        withCapabilities(config.capabilities).
        build();
        localStorage.setDriver(driver);
    });

    afterEach(function() {
        console.log("Test Ended");
        driver.quit();
    });

    it("1:: should login using redirect, call MSGraph and logout", async function() {
     await driver.get('https://msaljssampleapp-pk.azurewebsites.net/JavascriptSPA'); // Add catch for page not loading
     await driver.findElement(webdriver.By.id('SignInRedirect')).click(); // Add catch for element not found
     await driver.sleep(2000);
     await helpers.login(driver, 'test@pkanherkar.onmicrosoft.com', 'pass1@#$');

     var accessTokenKey = await helpers.validateLogin(driver, [settings.clientId]);
     //storage = await localStorage.get();
     //console.log(storage);
     expect(accessTokenKey).to.exist();

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
         await driver.sleep(2500);
         count++;
     }

     expect(bodyText.includes('test@pkanherkar.onmicrosoft.com'), "JSON doesn't include username.").to.be.true;

     //await driver.findElement(webdriver.By.css('div.table')).click();
    }).timeout(120000);

    it("2:: should login using popup, call MSGraph and logout", async function() {
           // Go to Web Page and click on Sign In button
           await driver.get('https://msaljssampleapp-pk.azurewebsites.net/JavascriptSPA');
           await driver.findElement(webdriver.By.id('SignInPopup')).click();

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
           expect(bodyText.includes('test@pkanherkar.onmicrosoft.com'), "JSON doesn't include username.").to.be.true;
           //assert.ok(bodyText.includes('test@pkanherkar.onmicrosoft.com'));

           //await driver.findElement(webdriver.By.css('div.table')).click();
     }).timeout(120000);
         // include catch for any errors, so that tests don't error out, but still show failures



   });