import { StartPage } from './app.po';
import {$, browser, by, element, protractor} from "protractor";

describe('start App', function() {
  let page: StartPage;

  beforeEach(() => {
    page = new StartPage();
  });

  /*it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
*/



 /* it('check if calendar route  works for redirect', () => {
    page.navigateTo();
    browser.waitForAngularEnabled(false);
    browser.get('/myCalendar');
     browser.driver.sleep(2000);

    browser.driver.findElements(by.id('i0116')).then(function (result) {

      browser.driver.findElement(by.id('i0116')).sendKeys("neha123@neagrawa.onmicrosoft.com");
      browser.driver.findElements(by.id('idSIButton9')).then(function (result) {
        browser.driver.findElement(by.id('idSIButton9')).click().then(function () {
          browser.driver.sleep(2000);
          browser.driver.findElements(by.name('passwd')).then(function () {
            browser.driver.findElement(by.name('passwd')).sendKeys("dingdong$12").then(function () {
              browser.driver.sleep(2000);
              browser.driver.findElements(by.id('idSIButton9')).then(function (result) {
                browser.driver.findElement(by.id('idSIButton9')).click().then(function () {
               browser.driver.sleep(3000);
                  browser.driver.findElements(by.id('logout')).then(function (result) {
                    browser.driver.findElement(by.id('logout')).click().then(function () {
                      browser.driver.sleep(3000);
                    });
                  });

                });
              });

            });
          });

        });


      });
    });



    });
*/


/*
    it('check if calendar route  works', () => {

      page.navigateTo();
    // let elem= element(by.buttonText('Login'));
    //  browser.executeScript('localStorage.setItem("foo", "bar");');


    //  browser.driver.sleep(8000);
    browser.get('/myCalendar');
      browser.waitForAngularEnabled(false);
     //let elem= element(by.linkText('Calendar')).click();

    //  var EC = browser.ExpectedConditions;
     // browser.driver.wait(EC.urlContains('https://login.microsoftonl+ine.com'), 500);

      browser.driver.sleep(1000);

      element(by.cssContainingText('table-cell', 'Use another account'));

     // browser.driver.findElement(by.id('i0116')).sendKeys("agrawal.neha@microsoft.com");
       browser.driver.findElement(by.id('i0116')).sendKeys("neha123@neagrawa.onmicrosoft.com");
      browser.driver.findElement(by.id('i0118')).sendKeys("dingdong$12");

      browser.driver.findElement(by.id('idSIButton9')).click();

browser.debugger();
      //selectWindow(1).then()
     // {
      //  element(by.cssContainingText('table-cell', 'Use another account'));

     // browser.driver.findElement(by.id('i0116')).sendKeys("agrawal.neha@microsoft.com");
       // browser.driver.findElement(by.id('i0116')).sendKeys("neha123@neagrawa.onmicrosoft.com");
       // browser.driver.findElement(by.id('i0118')).sendKeys("dingdong$12");

        //browser.driver.findElement(by.id('idSIButton9')).click();

    //  }
   //   browser.driver.sleep(10000);

   //   browser.driver.sleep(5000);

   //   browser.driver.findElement(by.xpath("//button[text() = 'Next']")).click();


     // waitForElement(element(by.id('header')));

      waitForUrlToChangeTo("http://localhost:4200/myCalendar").then(() => {
        expect(  browser.driver.getCurrentUrl()).toEqual("http://localhost:4200/myCalendar");

      });
   //   browser.driver.sleep(10000);

      browser.waitForAngularEnabled(true);


   //   expect(browser.getCurrentUrl()).toEqual('https://login.microsoftonline.com1');
    //  expect(elem.isPresent()).toBeTruthy();
     // browser.ignoreSynchronization = true;
     // browser.waitForAngular();
      //browser.sleep(500);


    });
    //click login button
*/

/*

  it('check if login button  works', () => {
    debugger;
    page.navigateTo();
    browser.executeScript('localStorage.setItem("foo", "bar");');
    let elem = element(by.linkText('Login')).click();
    browser.driver.sleep(1000);
    browser.waitForAngularEnabled(false);
    selectWindow(1).then()
    {
  //   element(by.cssContainingText('table-cell', 'Use another account'));

      browser.driver.sleep(1000);
      browser.driver.findElement(by.id('i0116')).sendKeys("neha123@neagrawa.onmicrosoft.com");
      browser.driver.findElement(by.id('i0118')).sendKeys("dingdong$12");
      browser.driver.sleep(1000);
      browser.driver.findElement(by.id('idSIButton9')).click();

    }
    browser.driver.sleep(5000);
    browser.waitForAngularEnabled(true);
    browser.driver.sleep(5000);

    selectWindow(0).then()
    {
      //element(by.linkText('Calendar')).click();
      //browser.get('http://localhost:4200/myCalendar');
    }
    // var result = browser.executeScript('return localStorage.getItem("foo");');
    //expect(result).toEqual("bar");

 //  browser.driver.sleep(15000);

  });
  */



  it('check if login button  works', () => {
   // debugger;
    page.navigateTo();
    // winHandleBefore: Promise<string> = browser.driver.getWindowHandle();

   // browser.executeScript('localStorage.setItem("foo", "bar");');
    let elem = element(by.linkText('Login')).click();
    browser.driver.sleep(1000);
    browser.waitForAngularEnabled(false);

    browser.driver.findElements(by.id('element1')).then(function(result) {
        if (result.length > 0) {
          browser.driver.findElement(by.id('element1')).click();
        }
        else {
        //  browser.driver.findElement(by.id('element2')).sendKeys("username");
        }
      }
    );

    selectWindow(1).then()
    {
      browser.driver.findElements(by.id('i0116')).then(function (result) {

        browser.driver.findElement(by.id('i0116')).sendKeys("neha123@neagrawa.onmicrosoft.com");
        browser.driver.findElements(by.id('idSIButton9')).then(function (result) {
          browser.driver.findElement(by.id('idSIButton9')).click().then(function () {
            browser.driver.sleep(2000);
            browser.driver.findElements(by.name('passwd')).then(function () {
              browser.driver.findElement(by.name('passwd')).sendKeys("dingdong$12").then(function () {
                browser.driver.sleep(2000);
                browser.driver.findElements(by.id('idSIButton9')).then(function (result) {
                  browser.driver.findElement(by.id('idSIButton9')).click().then(function () {
                    browser.driver.sleep(3000);
                    browser.driver.findElements(by.id('logout')).then(function (result) {
                      browser.driver.findElement(by.id('logout')).click().then(function () {
                        browser.driver.sleep(3000);
                      });
                    });

                  });

                });

              });
            });

          });


        });
      });
    }


    browser.waitForAngularEnabled(true);
  });

/*
  it(':1: ' + 'should login using redirectflow and logout', function () {
    var loginButton = element(by.id('loginButton'));
    browser.wait(EC.visibilityOf(loginButton), 5000, 'Login button is not displayed on the dom').then(function () {
      return loginButton.click();
    }).then(function () {
      return browser.wait(signInPage(), 5000, 'Error navigating to Signin Page');
    }).then(function () {
      return checkLoginState(settings.assignedUser, settings.password);
    }).then(function () {
      return browser.wait(homePage(), 5000, 'Error navigating to home page after sign-in');
    }).then(function () {
      validateLogin();
      return logout();
    }).then(function () {
      expect(getValueLocalStorage(Storage.IDTOKEN)).toEqual('');
    });
  });

*/
  afterEach(() => {
  /*  browser.executeScript('window.sessionStorage.clear();');
    browser.executeScript('window.localStorage.clear();');
    browser.driver.manage().deleteAllCookies(); */
  });

  function waitForUrl(expectedUrlFragment){
    browser.driver.wait(function() {
      return browser.driver.getCurrentUrl().then(function(url) {
        return new RegExp(expectedUrlFragment).test(url);
      });
    }, 5000)};

  function waitForElement (locator)  {
    browser.driver.wait(function () {
      return browser.driver.isElementPresent(locator);
    }, 5000);
  }


  function waitForElementUntil (locator)  {


    browser.driver.wait(function () {
      return browser.driver.isElementPresent(locator);
    }, 5000);
  }


  function waitForUrlToChangeTo(urlRegex) {
    var currentUrl;

    return browser.driver.getCurrentUrl().then(function storeCurrentUrl(url) {
        currentUrl = url;
      }
    ).then(function waitForUrlToChangeTo() {
        return browser.driver.wait(function waitForUrlToChangeTo() {
          return browser.driver.getCurrentUrl().then(function compareCurrentUrl(url) {
            // return urlRegex.test(url);
            return new RegExp(urlRegex).test(url);
          });
        });
      }
    );
  }

  function selectWindow (index) {

    // wait for handels[index] to exists
    browser.driver.wait(function() {
      return browser.driver.getAllWindowHandles().then(function (handles) {
        /**
         * Assume that handles.length >= 1 and index >=0.
         * So when i call selectWindow(index) i return
         * true if handles contains that window.
         */
        if(handles.length > index) {
          return true;
        }
      });
    });
    // here i know that the requested window exists

    // switch to the window
    return browser.driver.getAllWindowHandles().then(function (handles) {
      return browser.driver.switchTo().window(handles[index]);
    });
  };


});
