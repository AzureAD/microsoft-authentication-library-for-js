[14:45:41] I/launcher - Running 1 instances of WebDriver
[14:45:41] I/hosted - Using the selenium server at http://localhost:4444/wd/hub
Started

Should login using redirect flow and logout
1 : Start of Test
2 : Login method called
3 : End of Test

[31mF[0m
Should login using Popup and logout
1 : Start of Test
2 : End of Test

[31mF[0m
Should login using redirect flow, navigate to Todo page (external API) and check if token is served from the cache
1 : Start of Test
2 : Login method called
3 : End of Test

[31mF[0m
Should login using redirect flow, navigate to Calendar page (Graph API) and check if token is served from the cache
1 : Start of Test
2 : Login method called
3 : End of Test

[31mF[0m
Should login using redirect flow, remove expiration key for todo api access_token to 0, navigate to Todo page and check if token is renewed using iframe
1 : Start of Test
2 : Login method called
3 : End of Test

[31mF[0m
Should navigate to TodoPage without signing in and check if user is prompted for login followed by acquire token request to Todo api to retrieve an access_token
1 : Start of Test
2 : Navigating to Todo Page
3 : End of Test

[31mF[0m
Should save some state (text) on the Home page, login using popup window and check if the Home page is not reloaded and state is retained
1 : Start of Test
2 : Navigating to Home Page
3 : End of Test

[31mF[0m

Failures:
1) E2E tests Should login using redirect flow and logout
  Message:
[31m    Failed: Error navigating to home page after sign-in
    Wait timed out after 5007ms[0m
  Stack:
    TimeoutError: Error navigating to home page after sign-in
    Wait timed out after 5007ms
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at TimeoutError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:262:5)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2201:17
        at ManagedPromise.invokeCallback_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: Error navigating to home page after sign-in
        at scheduleWait (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2188:20)
        at ControlFlow.wait (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2517:12)
        at thenableWebDriverProxy.wait (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:934:29)
        at run (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:59:33)
        at ProtractorBrowser.to.(anonymous function) [as wait] (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:67:16)
        at C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:36:28
        at ManagedPromise.invokeCallback_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
    From: Task: Run it("Should login using redirect flow and logout") in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
        at shutdownTask_.MicroTask (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2599:53)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:29:17)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)

2) E2E tests Should login using Popup and logout
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.executeScript()
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at thenableWebDriverProxy.executeScript (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:878:16)
        at run (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:59:33)
        at ProtractorBrowser.to.(anonymous function) [as executeScript] (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:67:16)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:59:17)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
    From: Task: Run it("Should login using Popup and logout") in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
        at shutdownTask_.MicroTask (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2599:53)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:55:17)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.navigate().to(https://msalangularjssample.azurewebsites.net/)
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at Navigation.to (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1133:25)
        at thenableWebDriverProxy.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:988:28)
        at ProtractorBrowser.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:655:32)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:23:17)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
    From: Task: Run afterEach in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:22:5)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)

3) E2E tests Should login using redirect flow, navigate to Todo page (external API) and check if token is served from the cache
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.navigate().to(https://msalangularjssample.azurewebsites.net/)
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at Navigation.to (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1133:25)
        at thenableWebDriverProxy.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:988:28)
        at ProtractorBrowser.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:655:32)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:19:17)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
    From: Task: Run beforeEach in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:17:5)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.findElements(By(css selector, *[id="loginButton"]))
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at thenableWebDriverProxy.findElements (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1048:19)
        at ptor.waitForAngular.then (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\element.js:159:44)
        at ManagedPromise.invokeCallback_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
    From: Task: <anonymous>
        at pollCondition (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2195:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2191:7
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2190:22
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
    From: Task: Login button is not displayed on the dom
        at scheduleWait (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2188:20)
        at ControlFlow.wait (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2517:12)
        at thenableWebDriverProxy.wait (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:934:29)
        at run (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:59:33)
        at ProtractorBrowser.to.(anonymous function) [as wait] (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:67:16)
        at SignInModule.login (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\signInModule.js:17:24)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:98:22)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
    From: Task: Run it("Should login using redirect flow, navigate to Todo page (external API) and check if token is served from the cache") in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:94:17)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.navigate().to(https://msalangularjssample.azurewebsites.net/)
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at Navigation.to (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1133:25)
        at thenableWebDriverProxy.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:988:28)
        at ProtractorBrowser.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:655:32)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:23:17)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
    From: Task: Run afterEach in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:22:5)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)

4) E2E tests Should login using redirect flow, navigate to Calendar page (Graph API) and check if token is served from the cache
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.navigate().to(https://msalangularjssample.azurewebsites.net/)
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at Navigation.to (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1133:25)
        at thenableWebDriverProxy.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:988:28)
        at ProtractorBrowser.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:655:32)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:19:17)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
    From: Task: Run beforeEach in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:17:5)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.findElements(By(css selector, *[id="loginButton"]))
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at thenableWebDriverProxy.findElements (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1048:19)
        at ptor.waitForAngular.then (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\element.js:159:44)
        at ManagedPromise.invokeCallback_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
    From: Task: <anonymous>
        at pollCondition (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2195:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2191:7
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2190:22
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
    From: Task: Login button is not displayed on the dom
        at scheduleWait (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2188:20)
        at ControlFlow.wait (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2517:12)
        at thenableWebDriverProxy.wait (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:934:29)
        at run (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:59:33)
        at ProtractorBrowser.to.(anonymous function) [as wait] (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:67:16)
        at SignInModule.login (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\signInModule.js:17:24)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:127:22)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
    From: Task: Run it("Should login using redirect flow, navigate to Calendar page (Graph API) and check if token is served from the cache") in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:123:17)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.navigate().to(https://msalangularjssample.azurewebsites.net/)
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at Navigation.to (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1133:25)
        at thenableWebDriverProxy.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:988:28)
        at ProtractorBrowser.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:655:32)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:23:17)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
    From: Task: Run afterEach in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:22:5)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)

5) E2E tests Should login using redirect flow, remove expiration key for todo api access_token to 0, navigate to Todo page and check if token is renewed using iframe
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.navigate().to(https://msalangularjssample.azurewebsites.net/)
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at Navigation.to (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1133:25)
        at thenableWebDriverProxy.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:988:28)
        at ProtractorBrowser.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:655:32)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:19:17)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
    From: Task: Run beforeEach in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:17:5)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.findElements(By(css selector, *[id="loginButton"]))
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at thenableWebDriverProxy.findElements (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1048:19)
        at ptor.waitForAngular.then (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\element.js:159:44)
        at ManagedPromise.invokeCallback_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
    From: Task: <anonymous>
        at pollCondition (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2195:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2191:7
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2190:22
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
    From: Task: Login button is not displayed on the dom
        at scheduleWait (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2188:20)
        at ControlFlow.wait (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2517:12)
        at thenableWebDriverProxy.wait (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:934:29)
        at run (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:59:33)
        at ProtractorBrowser.to.(anonymous function) [as wait] (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:67:16)
        at SignInModule.login (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\signInModule.js:17:24)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:166:22)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
    From: Task: Run it("Should login using redirect flow, remove expiration key for todo api access_token to 0, navigate to Todo page and check if token is renewed using iframe") in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:161:17)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.navigate().to(https://msalangularjssample.azurewebsites.net/)
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at Navigation.to (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1133:25)
        at thenableWebDriverProxy.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:988:28)
        at ProtractorBrowser.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:655:32)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:23:17)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
    From: Task: Run afterEach in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:22:5)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)

6) E2E tests Should navigate to TodoPage without signing in and check if user is prompted for login followed by acquire token request to Todo api to retrieve an access_token
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.navigate().to(https://msalangularjssample.azurewebsites.net/)
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at Navigation.to (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1133:25)
        at thenableWebDriverProxy.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:988:28)
        at ProtractorBrowser.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:655:32)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:19:17)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
    From: Task: Run beforeEach in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:17:5)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.findElements(By(xpath, //a[@ui-sref='TodoList']))
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at thenableWebDriverProxy.findElements (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1048:19)
        at ptor.waitForAngular.then (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\element.js:159:44)
        at ManagedPromise.invokeCallback_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7Error
        at ElementArrayFinder.applyAction_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\element.js:459:27)
        at ElementArrayFinder.(anonymous function) [as click] (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\element.js:91:29)
        at ElementFinder.(anonymous function) [as click] (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\element.js:831:22)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:211:27)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
    From: Task: Run it("Should navigate to TodoPage without signing in and check if user is prompted for login followed by acquire token request to Todo api to retrieve an access_token") in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:205:17)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.navigate().to(https://msalangularjssample.azurewebsites.net/)
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at Navigation.to (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1133:25)
        at thenableWebDriverProxy.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:988:28)
        at ProtractorBrowser.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:655:32)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:23:17)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
    From: Task: Run afterEach in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:22:5)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)

7) E2E tests Should save some state (text) on the Home page, login using popup window and check if the Home page is not reloaded and state is retained
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.navigate().to(https://msalangularjssample.azurewebsites.net/)
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at Navigation.to (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1133:25)
        at thenableWebDriverProxy.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:988:28)
        at ProtractorBrowser.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:655:32)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:19:17)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
    From: Task: Run beforeEach in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:17:5)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.findElements(By(xpath, //a[@ui-sref='Home']))
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at thenableWebDriverProxy.findElements (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1048:19)
        at ptor.waitForAngular.then (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\element.js:159:44)
        at ManagedPromise.invokeCallback_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7Error
        at ElementArrayFinder.applyAction_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\element.js:459:27)
        at ElementArrayFinder.(anonymous function) [as click] (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\element.js:91:29)
        at ElementFinder.(anonymous function) [as click] (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\element.js:831:22)
        at Pages.clickHomePage (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\pages.js:44:27)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:241:22)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
    From: Task: Run it("Should save some state (text) on the Home page, login using popup window and check if the Home page is not reloaded and state is retained") in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:236:17)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)
  Message:
[31m    Failed: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)[0m
  Stack:
    WebDriverError: chrome not reachable
      (Session info: chrome=67.0.3396.99)
      (Driver info: chromedriver=2.40.565498 (ea082db3280dd6843ebfb08a625e3eb905c4f5ab),platform=Windows NT 10.0.17134 x86_64)
        at WebDriverError (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:27:5)
        at Object.checkLegacyResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\error.js:546:15)
        at parseHttpResponse (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:509:13)
        at doSend.then.response (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\http.js:441:30)
        at process._tickCallback (internal/process/next_tick.js:109:7)
    From: Task: WebDriver.navigate().to(https://msalangularjssample.azurewebsites.net/)
        at thenableWebDriverProxy.schedule (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:807:17)
        at Navigation.to (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:1133:25)
        at thenableWebDriverProxy.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:988:28)
        at ProtractorBrowser.get (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\built\browser.js:655:32)
        at UserContext.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:23:17)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
    From: Task: Run afterEach in control flow
        at UserContext.<anonymous> (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\RONARU\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:22:5)
        at Object.<anonymous> (C:\git\msal0.1.6\lib\msalAngularjs\tests\endToEndTests\e2eTestsSpec.js:9:1)
        at Module._compile (module.js:570:32)
        at Object.Module._extensions..js (module.js:579:10)
        at Module.load (module.js:487:32)
        at tryModuleLoad (module.js:446:12)

7 specs, 7 failures
Finished in 135.636 seconds

[14:48:01] I/launcher - 0 instance(s) of WebDriver still running
[14:48:01] I/launcher - chrome #01 failed 7 test(s)
[14:48:01] I/launcher - overall: 7 failed spec(s)
[14:48:01] E/launcher - Process exited with error code 1
