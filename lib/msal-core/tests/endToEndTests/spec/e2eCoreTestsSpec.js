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

    it("1:: should login using redirect and logout", async function() {
     var redirectBtn = webdriver.By.id('SignInRedirect');
     var popupBtn = webdriver.By.id('SignInPopup');
     await driver.get(settings.appUrl); // Add catch for page not loading
     await driver.findElement(redirectBtn).click(); // Add catch for element not found
     await driver.sleep(2000);
     await helpers.login(driver, settings.assignedUser, settings.password);

     var accessTokenKey = await helpers.validateLogin(driver, [settings.clientID]);
     expect(accessTokenKey).to.exist;

     var user = await helpers.getUser(driver);
     expect(user.displayableId).to.equal(settings.assignedUser);

     await driver.findElement(popupBtn).click(); // Hit logout button
     await driver.findElement(webdriver.By.className('table')).click(); // Choose account to sign out of and sign out
     await driver.wait(webdriver.until.elementLocated(popupBtn)); // Wait until login screen is shown again
     await helpers.validateLogout(driver); // Validate logout successful
    }).timeout(120000);

    it("2:: should login using popup and logout", async function() {
           var redirectBtn = webdriver.By.id('SignInRedirect');
           var popupBtn = webdriver.By.id('SignInPopup');
           // Go to Web Page and click on Sign In button
           await driver.get(settings.appUrl);
           await driver.findElement(popupBtn).click();

           var parentWindow = await driver.getWindowHandle();
           var handles = await driver.getAllWindowHandles();

           for(let handle of handles) {
               if(parentWindow === handle) {
                   console.log("Parent window");
               } else {
                   await driver.switchTo().window(handle);
                   await helpers.login(driver, settings.assignedUser, settings.password);
                   handles = await driver.getAllWindowHandles();
                   if(handles.length > 1) {
                       console.log("login failed");
                   } else {
                       await driver.switchTo().window(parentWindow);
                   }
               }
           }

           var accessTokenKey = await helpers.validateLogin(driver, [settings.clientID]);
           expect(accessTokenKey).to.exist;

           var user = await helpers.getUser(driver);
           expect(user.displayableId).to.equal(settings.assignedUser);

           await driver.findElement(popupBtn).click(); // Hit logout button
           await driver.findElement(webdriver.By.className('table')).click(); // Choose account to sign out of and sign out
           await driver.wait(webdriver.until.elementLocated(popupBtn)); // Wait until login screen is shown again
           await helpers.validateLogout(driver); // Validate logout successful
     }).timeout(120000);
         // include catch for any errors, so that tests don't error out, but still show failures

     it("3:: should login using redirect, navigate to protected route and call MS Graph API", async function() {
         var redirectBtn = webdriver.By.id('SignInRedirect');
         var popupBtn = webdriver.By.id('SignInPopup');
         var callGraphBtn = webdriver.By.id('CallGraph');
         await driver.get(settings.appUrl); // Add catch for page not loading
         await driver.findElement(redirectBtn).click(); // Add catch for element not found
         await driver.sleep(2000);
         await helpers.login(driver, settings.assignedUser, settings.password);

         var accessTokenKey = await helpers.validateLogin(driver, [settings.clientID]);
         expect(accessTokenKey).to.exist;

        await driver.findElement(callGraphBtn).click(); // Call Graph

        var body = await driver.findElement(webdriver.By.id("json"));
         count = 0;
         var bodyText = "";
         while(!bodyText) {
             if(count > constants.RETRY_FETCH) {
                 break;
             }
             await body.getText().then(function(text) {
                 bodyText = text;
             });
             await driver.sleep(2500);
             count++;
         }

         expect(bodyText.includes(settings.assignedUser), "JSON doesn't include username.").to.be.true;

         await driver.findElement(popupBtn).click(); // Hit logout button
         await driver.findElement(webdriver.By.className('table')).click(); // Choose account to sign out of and sign out
         await driver.wait(webdriver.until.elementLocated(popupBtn)); // Wait until login screen is shown again
         await helpers.validateLogout(driver); // Validate logout successful
     }).timeout(120000);
      // include catch for any errors, so that tests don't error out, but still show failures

     it("4:: should login using popup, navigate to protected route and call MSGraph", async function() {
        var redirectBtn = webdriver.By.id('SignInRedirect');
       var popupBtn = webdriver.By.id('SignInPopup');
       var callGraphBtn = webdriver.By.id('CallGraph');
       // Go to Web Page and click on Sign In button
       await driver.get(settings.appUrl);
       await driver.findElement(popupBtn).click();

       var parentWindow = await driver.getWindowHandle();
       var handles = await driver.getAllWindowHandles();

       for(let handle of handles) {
           if(parentWindow === handle) {
               console.log("Parent window");
           } else {
               await driver.switchTo().window(handle);
               await helpers.login(driver, settings.assignedUser, settings.password);
               handles = await driver.getAllWindowHandles();
               if(handles.length > 1) {
                   console.log("login failed");
               } else {
                   await driver.switchTo().window(parentWindow);
               }
           }
       }

       var accessTokenKey = await helpers.validateLogin(driver, [settings.clientID]);
       expect(accessTokenKey).to.exist;

       await driver.findElement(callGraphBtn).click(); // Call Graph

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

       expect(bodyText.includes(settings.assignedUser), "JSON doesn't include username.").to.be.true;

       await driver.findElement(popupBtn).click(); // Hit logout button
       await driver.findElement(webdriver.By.className('table')).click(); // Choose account to sign out of and sign out
       await driver.wait(webdriver.until.elementLocated(popupBtn)); // Wait until login screen is shown again
       await helpers.validateLogout(driver); // Validate logout successful
    }).timeout(120000);
      // include catch for any errors, so that tests don't error out, but still show failures

    it("5:: should login using redirect, navigate to protected route and call external API", async function() {
           var redirectBtn = webdriver.By.id('SignInRedirect');
            var popupBtn = webdriver.By.id('SignInPopup');
            var callGraphBtn = webdriver.By.id('CallGraph');
            var callExtApiBtn = webdriver.By.id('CallExtApi');
            await driver.get(settings.appUrl); // Add catch for page not loading
            await driver.findElement(redirectBtn).click(); // Add catch for element not found
            await driver.sleep(2000);
            await helpers.login(driver, settings.assignedUser, settings.password);

            var accessTokenKey = await helpers.validateLogin(driver, [settings.clientID]);
            expect(accessTokenKey).to.exist;

            await driver.findElement(callExtApiBtn).click(); // Call Graph

            var body = await driver.findElement(webdriver.By.id("json"));
             count = 0;
             var bodyText = "";
             while(!bodyText) {
                 if(count > constants.RETRY_FETCH) {
                     break;
                 }
                 await body.getText().then(function(text) {
                     bodyText = text;
                 });
                 await driver.sleep(2500);
                 count++;
             }

             expect(bodyText, "JSON doesn't include username.").to.exist;

             await driver.findElement(popupBtn).click(); // Hit logout button
             await driver.findElement(webdriver.By.className('table')).click(); // Choose account to sign out of and sign out
             await driver.wait(webdriver.until.elementLocated(popupBtn)); // Wait until login screen is shown again
             await helpers.validateLogout(driver); // Validate logout successful
     }).timeout(120000);
     // include catch for any errors, so that tests don't error out, but still show failures

    it("6:: should login using popup, navigate to protected route and call external API", async function() {
               // Go to Web Page and click on Sign In button
          var redirectBtn = webdriver.By.id('SignInRedirect');
          var popupBtn = webdriver.By.id('SignInPopup');
          var callGraphBtn = webdriver.By.id('CallGraph');
          var callExtApiBtn = webdriver.By.id('CallExtApi');
          // Go to Web Page and click on Sign In button
          await driver.get(settings.appUrl);
          await driver.findElement(popupBtn).click();

          var parentWindow = await driver.getWindowHandle();
          var handles = await driver.getAllWindowHandles();

          for(let handle of handles) {
              if(parentWindow === handle) {
                  console.log("Parent window");
              } else {
                  await driver.switchTo().window(handle);
                  await helpers.login(driver, settings.assignedUser, settings.password);
                  handles = await driver.getAllWindowHandles();
                  if(handles.length > 1) {
                      console.log("login failed");
                  } else {
                      await driver.switchTo().window(parentWindow);
                  }
              }
          }

         var accessTokenKey = await helpers.validateLogin(driver, [settings.clientID]);
         expect(accessTokenKey).to.exist;

         await driver.findElement(callExtApiBtn).click(); // Call Graph
         await driver.wait(webdriver.until.elementLocated(webdriver.By.id('json')), 5000);
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

         expect(bodyText.includes("["), "JSON doesn't look right.").to.be.true;

         await driver.findElement(popupBtn).click(); // Hit logout button
         await driver.findElement(webdriver.By.className('table')).click(); // Choose account to sign out of and sign out
         await driver.wait(webdriver.until.elementLocated(popupBtn)); // Wait until login screen is shown again
         await helpers.validateLogout(driver); // Validate logout successful
     }).timeout(120000);
     // include catch for any errors, so that tests don't error out, but still show failures

     it("7:: Text box is cleared after login redirect", async function() {
        var redirectBtn = webdriver.By.id('SignInRedirect');
        var popupBtn = webdriver.By.id('SignInPopup');
        var todoTextBox = webdriver.By.id('todoItem');
         await driver.get(settings.appUrl); // Add catch for page not loading
         await driver.findElement(todoTextBox).sendKeys('test');
         await driver.findElement(redirectBtn).click(); // Add catch for element not found
         await driver.sleep(2000);
         await helpers.login(driver, settings.assignedUser, settings.password);

         var accessTokenKey = await helpers.validateLogin(driver, [settings.clientID]);
         expect(accessTokenKey).to.exist;

         var textBoxValue = await driver.findElement(todoTextBox).getAttribute("value");
         expect(textBoxValue).to.be.empty;

         await driver.findElement(popupBtn).click(); // Hit logout button
         await driver.findElement(webdriver.By.className('table')).click(); // Choose account to sign out of and sign out
         await driver.wait(webdriver.until.elementLocated(popupBtn)); // Wait until login screen is shown again
         await helpers.validateLogout(driver); // Validate logout successful
    }).timeout(120000);
   //include catch for any errors, so that tests don't error out, but still show failures

    it("8:: Text box is persistent after login popup", async function() {
        var redirectBtn = webdriver.By.id('SignInRedirect');
        var popupBtn = webdriver.By.id('SignInPopup');
        var todoTextBox = webdriver.By.id('todoItem');
        // Go to Web Page and click on Sign In button
        await driver.get(settings.appUrl);
        await driver.findElement(todoTextBox).sendKeys("test");
        await driver.findElement(popupBtn).click();

        var parentWindow = await driver.getWindowHandle();
        var handles = await driver.getAllWindowHandles();

        for(let handle of handles) {
            if(parentWindow === handle) {
                console.log("Parent window");
            } else {
                await driver.switchTo().window(handle);
                await helpers.login(driver, settings.assignedUser, settings.password);
                handles = await driver.getAllWindowHandles();
                if(handles.length > 1) {
                    console.log("login failed");
                } else {
                    await driver.switchTo().window(parentWindow);
                }
            }
        }

        var accessTokenKey = await helpers.validateLogin(driver, [settings.clientID]);
        expect(accessTokenKey).to.exist;

        var textBoxValue = await driver.findElement(todoTextBox).getAttribute("value");
        expect(textBoxValue).to.equal("test");

        await driver.findElement(popupBtn).click(); // Hit logout button
        await driver.findElement(webdriver.By.className('table')).click(); // Choose account to sign out of and sign out
        await driver.wait(webdriver.until.elementLocated(popupBtn)); // Wait until login screen is shown again
        await helpers.validateLogout(driver); // Validate logout successful
     }).timeout(120000);
     // include catch for any errors, so that tests don't error out, but still show failures
//
//    it("9a:: login using login_redirect and delete id token, expect idtoken to acquire silently", async function() {
//           // Go to Web Page and click on Sign In button
//           await driver.get('https://msaljssampleapp-pk.azurewebsites.net/JavascriptSPA');
//           await driver.findElement(webdriver.By.id('SignInPopup')).click();
//
//           var parentWindow = await driver.getWindowHandle();
//           var handles = await driver.getAllWindowHandles();
//
//           for(let handle of handles) {
//               if(parentWindow === handle) {
//                   console.log("Parent window");
//               } else {
//                   await driver.switchTo().window(handle);
//                   await helpers.login(driver, 'test@pkanherkar.onmicrosoft.com', '');
//                   handles = await driver.getAllWindowHandles();
//                   if(handles.length > 1) {
//                       console.log("login failed");
//                   } else {
//                       await driver.switchTo().window(parentWindow);
//                   }
//               }
//           }
//
//           var body = await driver.findElement(webdriver.By.id("json"));
//           count = 0;
//           var bodyText = "";
//           while(!bodyText) {
//               if(count > 2) {
//                   break;
//               }
//               await body.getText().then(function(text) {
//                   bodyText = text;
//               });
//               driver.sleep(2500);
//               count++;
//           }
//           expect(bodyText.includes('test@pkanherkar.onmicrosoft.com'), "JSON doesn't include username.").to.be.true;
//           //assert.ok(bodyText.includes('test@pkanherkar.onmicrosoft.com'));
//
//           //await driver.findElement(webdriver.By.css('div.table')).click();
//     }).timeout(120000);
//     // include catch for any errors, so that tests don't error out, but still show failures
//
//    it("9b:: login using login_popup and delete id token, expect idtoken to acquire silently", async function() {
//           // Go to Web Page and click on Sign In button
//           await driver.get('https://msaljssampleapp-pk.azurewebsites.net/JavascriptSPA');
//           await driver.findElement(webdriver.By.id('SignInPopup')).click();
//
//           var parentWindow = await driver.getWindowHandle();
//           var handles = await driver.getAllWindowHandles();
//
//           for(let handle of handles) {
//               if(parentWindow === handle) {
//                   console.log("Parent window");
//               } else {
//                   await driver.switchTo().window(handle);
//                   await helpers.login(driver, 'test@pkanherkar.onmicrosoft.com', '');
//                   handles = await driver.getAllWindowHandles();
//                   if(handles.length > 1) {
//                       console.log("login failed");
//                   } else {
//                       await driver.switchTo().window(parentWindow);
//                   }
//               }
//           }
//
//           var body = await driver.findElement(webdriver.By.id("json"));
//           count = 0;
//           var bodyText = "";
//           while(!bodyText) {
//               if(count > 2) {
//                   break;
//               }
//               await body.getText().then(function(text) {
//                   bodyText = text;
//               });
//               driver.sleep(2500);
//               count++;
//           }
//           expect(bodyText.includes('test@pkanherkar.onmicrosoft.com'), "JSON doesn't include username.").to.be.true;
//           //assert.ok(bodyText.includes('test@pkanherkar.onmicrosoft.com'));
//
//           //await driver.findElement(webdriver.By.css('div.table')).click();
//     }).timeout(120000);
//     // include catch for any errors, so that tests don't error out, but still show failures

  });