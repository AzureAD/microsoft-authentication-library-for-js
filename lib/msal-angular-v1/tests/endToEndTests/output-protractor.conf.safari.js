[10:23:13] I/launcher - Running 1 instances of WebDriver
[10:23:13] I/hosted - Using the selenium server at http://hub-cloud.browserstack.com/wd/hub
[10:23:37] W/runner - Ignoring unknown extra flags: parameters. This will be an error in future versions, please use --disableChecks flag to disable the  Protractor CLI flag checks. 
Started
1:: Should login using redirect flow and logout
1 : Start of Test
2 : End of Test

[31mF[0m3 :: Should login using redirect flow, navigate to Calendar tab (MS Graph API) and check if token is served from the cache
1 : Start of Test
2 : End of Test

[31mF[0m1 : End of Test

[31mF[0m4 :: should navigate to a protected route(calendar) using redirect flow and check if user gets redirected to the login page. After successful authentication, user should get redirected back to the protected route
1 : Start of Test
2 : End of Test

[31mF[0m5 :: should login using popup flow, navigate to calendar tab and check if token is served from the cache
1 : Start of Test
2 : End of Test

[31mF[0m6 :: should navigate to Home page, enter text in a textbox, log in using redirect flow and check if textbox text gets cleared as app gets reloaded
1 : Start of Test
2 : End of Test

[31mF[0m7 :: should navigate to Home page, enter text in a textbox, log in using popUp and check if textbox text is retained as app does not get reloaded
1 : Start of Test
2 : End of Test

[31mF[0m

Failures:
1) E2ETests MSAL Angular 1:: Should login using redirect flow and logout
  Message:
[31m    Failed: Login button is not displayed on the dom
    Wait timed out after 5043ms[0m
  Stack:
    TimeoutError: Login button is not displayed on the dom
    Wait timed out after 5043ms
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2201:17
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)
    From: Task: Login button is not displayed on the dom
        at scheduleWait (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2188:20)
        at ControlFlow.wait (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2517:12)
        at thenableWebDriverProxy.wait (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:934:29)
        at run (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\browser.js:59:33)
        at ProtractorBrowser.to.(anonymous function) [as wait] (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\browser.js:67:16)
        at UserContext.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:226:17)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
    From: Task: Run it("1:: Should login using redirect flow and logout") in control flow
        at UserContext.<anonymous> (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
        at shutdownTask_.MicroTask (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2599:53)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:222:17)
        at Object.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:3:1)
        at Module._compile (module.js:643:30)
        at Object.Module._extensions..js (module.js:654:10)
        at Module.load (module.js:556:32)
        at tryModuleLoad (module.js:499:12)

2) E2ETests MSAL Angular 2 :: should login using popup and logout
  Message:
[31m    Failed: Login button is not displayed on the dom
    Wait timed out after 5085ms[0m
  Stack:
    TimeoutError: Login button is not displayed on the dom
    Wait timed out after 5085ms
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2201:17
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)
    From: Task: Login button is not displayed on the dom
        at scheduleWait (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2188:20)
        at ControlFlow.wait (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2517:12)
        at thenableWebDriverProxy.wait (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:934:29)
        at run (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\browser.js:59:33)
        at ProtractorBrowser.to.(anonymous function) [as wait] (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\browser.js:67:16)
        at UserContext.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:252:17)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
    From: Task: Run it("2 :: should login using popup and logout") in control flow
        at UserContext.<anonymous> (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
        at shutdownTask_.MicroTask (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2599:53)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:246:17)
        at Object.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:3:1)
        at Module._compile (module.js:643:30)
        at Object.Module._extensions..js (module.js:654:10)
        at Module.load (module.js:556:32)
        at tryModuleLoad (module.js:499:12)

3) E2ETests MSAL Angular 3 :: Should login using redirect flow, navigate to Calendar tab (MS Graph API) and check if token is served from the cache
  Message:
[31m    Failed: spec3 is not defined[0m
  Stack:
    ReferenceError: spec3 is not defined
        at UserContext.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:281:21)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2974:25)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
    From: Task: Run it("3 :: Should login using redirect flow, navigate to Calendar tab (MS Graph API) and check if token is served from the cache") in control flow
        at UserContext.<anonymous> (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
        at shutdownTask_.MicroTask (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2599:53)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:280:17)
        at Object.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:3:1)
        at Module._compile (module.js:643:30)
        at Object.Module._extensions..js (module.js:654:10)
        at Module.load (module.js:556:32)
        at tryModuleLoad (module.js:499:12)

4) E2ETests MSAL Angular 4 :: should navigate to a protected route(calendar) using redirect flow and check if user gets redirected to the login page. After successful authentication, user should get redirected back to the protected route
  Message:
[31m    Failed: calendar is not displayed on the dom
    Wait timed out after 5052ms[0m
  Stack:
    TimeoutError: calendar is not displayed on the dom
    Wait timed out after 5052ms
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2201:17
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)
    From: Task: calendar is not displayed on the dom
        at scheduleWait (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2188:20)
        at ControlFlow.wait (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2517:12)
        at thenableWebDriverProxy.wait (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:934:29)
        at run (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\browser.js:59:33)
        at ProtractorBrowser.to.(anonymous function) [as wait] (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\browser.js:67:16)
        at UserContext.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:315:17)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
    From: Task: Run it("4 :: should navigate to a protected route(calendar) using redirect flow and check if user gets redirected to the login page. After successful authentication, user should get redirected back to the protected route") in control flow
        at UserContext.<anonymous> (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
        at shutdownTask_.MicroTask (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2599:53)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:310:17)
        at Object.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:3:1)
        at Module._compile (module.js:643:30)
        at Object.Module._extensions..js (module.js:654:10)
        at Module.load (module.js:556:32)
        at tryModuleLoad (module.js:499:12)

5) E2ETests MSAL Angular 5 :: should login using popup flow, navigate to calendar tab and check if token is served from the cache
  Message:
[31m    Failed: Login button is not displayed on the dom
    Wait timed out after 5045ms[0m
  Stack:
    TimeoutError: Login button is not displayed on the dom
    Wait timed out after 5045ms
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2201:17
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)
    From: Task: Login button is not displayed on the dom
        at scheduleWait (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2188:20)
        at ControlFlow.wait (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2517:12)
        at thenableWebDriverProxy.wait (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\webdriver.js:934:29)
        at run (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\browser.js:59:33)
        at ProtractorBrowser.to.(anonymous function) [as wait] (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\browser.js:67:16)
        at UserContext.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:347:17)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
    From: Task: Run it("5 :: should login using popup flow, navigate to calendar tab and check if token is served from the cache") in control flow
        at UserContext.<anonymous> (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
        at shutdownTask_.MicroTask (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2599:53)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:341:17)
        at Object.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:3:1)
        at Module._compile (module.js:643:30)
        at Object.Module._extensions..js (module.js:654:10)
        at Module.load (module.js:556:32)
        at tryModuleLoad (module.js:499:12)

6) E2ETests MSAL Angular 6 :: should navigate to Home page, enter text in a textbox, log in using redirect flow and check if textbox text gets cleared as app gets reloaded
  Message:
[31m    Failed: No element found using locator: By(link text, Home)[0m
  Stack:
    NoSuchElementError: No element found using locator: By(link text, Home)
        at elementArrayFinder.getWebElements.then (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\element.js:814:27)
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)Error
        at ElementArrayFinder.applyAction_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\element.js:459:27)
        at ElementArrayFinder.(anonymous function).args [as click] (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\element.js:91:29)
        at ElementFinder.(anonymous function).args [as click] (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\element.js:831:22)
        at C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:390:21
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
    From: Task: Run it("6 :: should navigate to Home page, enter text in a textbox, log in using redirect flow and check if textbox text gets cleared as app gets reloaded") in control flow
        at UserContext.<anonymous> (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
        at shutdownTask_.MicroTask (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2599:53)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:384:17)
        at Object.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:3:1)
        at Module._compile (module.js:643:30)
        at Object.Module._extensions..js (module.js:654:10)
        at Module.load (module.js:556:32)
        at tryModuleLoad (module.js:499:12)

7) E2ETests MSAL Angular 7 :: should navigate to Home page, enter text in a textbox, log in using popUp and check if textbox text is retained as app does not get reloaded
  Message:
[31m    Failed: No element found using locator: By(link text, Home)[0m
  Stack:
    NoSuchElementError: No element found using locator: By(link text, Home)
        at elementArrayFinder.getWebElements.then (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\element.js:814:27)
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)Error
        at ElementArrayFinder.applyAction_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\element.js:459:27)
        at ElementArrayFinder.(anonymous function).args [as click] (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\element.js:91:29)
        at ElementFinder.(anonymous function).args [as click] (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\built\element.js:831:22)
        at UserContext.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:434:24)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:112:25
        at new ManagedPromise (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1077:7)
        at ControlFlow.promise (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2505:12)
        at schedulerExecute (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:95:18)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
    From: Task: Run it("7 :: should navigate to Home page, enter text in a textbox, log in using popUp and check if textbox text is retained as app does not get reloaded") in control flow
        at UserContext.<anonymous> (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:94:19)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\jasminewd2\index.js:64:48
        at ControlFlow.emit (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\events.js:62:21)
        at ControlFlow.shutdown_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2674:10)
        at shutdownTask_.MicroTask (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2599:53)
    From asynchronous test: 
    Error
        at Suite.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:428:17)
        at Object.<anonymous> (C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:3:1)
        at Module._compile (module.js:643:30)
        at Object.Module._extensions..js (module.js:654:10)
        at Module.load (module.js:556:32)
        at tryModuleLoad (module.js:499:12)

7 specs, 7 failures
Finished in 35.987 seconds

[10:24:25] I/launcher - 0 instance(s) of WebDriver still running
[10:24:25] I/launcher - Safari #01 failed 7 test(s)
[10:24:25] I/launcher - overall: 7 failed spec(s)
[10:24:25] E/launcher - Process exited with error code 1
