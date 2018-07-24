[12:59:51] I/launcher - Running 1 instances of WebDriver
[12:59:51] I/hosted - Using the selenium server at https://hub-cloud.browserstack.com/wd/hub
[13:00:00] W/runner - Ignoring unknown extra flags: parameters. This will be an error in future versions, please use --disableChecks flag to disable the  Protractor CLI flag checks. 
Started
1:: Should login using redirect flow and logout
1 : Start of Test
2 : Verifying BrowserCache for id_token
3 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
4 : Sign in Success
5 : logout method called
[13:00:17] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
6 : Logout button clicked
7 : Redirecting back to Home page after Logout
8 : Verifying if Msal cache entries are reset
9 : Log out Success
10 : End of Test

[32m.[0m2 :: should login using popup and logout
1 : Start of Test
2 : Verifying BrowserCache for id_token
3 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
4 : Sign in Success
5 : logout method called
[13:00:38] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
6 : Logout button clicked
7 : Redirecting back to Home page after Logout
8 : Verifying if Msal cache entries are reset
9 : Log out Success
10 : End of Test

[31mF[0m3 :: Should login using redirect flow, navigate to Calendar tab (MS Graph API) and check if token is served from the cache
1 : Start of Test
2 : Verifying BrowserCache for id_token
3 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
4 : Sign in Success
5 : Calling MS Graph API
6 : Verifying BrowserCache for access_token
null
7 : logout method called
[13:01:01] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
8 : Logout button clicked
9 : Redirecting back to Home page after Logout
10 : Verifying if Msal cache entries are resetted
11 : Log out Success
12 : End of Test

[31mF[0m4 :: should navigate to a protected route(calendar) using redirect flow and check if user gets redirected to the login page. After successful authentication, user should get redirected back to the protected route
1 : Start of Test
2 : Navigating to a protected route without a signed-in user
3 : User gets redirected to the sign-in page
4 : Verifying BrowserCache for id_token
5 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
6 : login start page is saved with the url of the protected route
7 : Verifying BrowserCache for access_token
null
8 : logout method called
[13:01:27] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
9 : Logout button clicked
10 : Redirecting back to Home page after Logout
11 : Verifying if Msal cache entries are resetted
12 : Log out Success
13 : End of Test

[31mF[0m5 :: should login using popup flow, navigate to calendar tab and check if token is served from the cache
1 : Start of Test
2 : Verifying BrowserCache for id_token
3 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
4 : Popup window is closed after successful login
5 : Sending request to MS Graph api
6 : Verifying BrowserCache for access_token
null
7 : logout method called
[13:01:51] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
8 : Logout button clicked
9 : Redirecting back to Home page after Logout
10 : Verifying if Msal cache entries are resetted
11 : Log out Success
12 : End of Test

[31mF[0m6 :: should navigate to Home page, enter text in a textbox, log in using redirect flow and check if textbox text gets cleared as app gets reloaded
1 : Start of Test
2 : Entering text in a textbox on the home page
3 : Verifying BrowserCache for id_token
4 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
5 : App is reloaded in case of login using a redirect
6 : logout method called
[13:02:17] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
7 : Logout button clicked
8 : Redirecting back to Home page after Logout
9 : Verifying if Msal cache entries are reset
10 : Log out Success
11 : End of Test

[32m.[0m7 :: should navigate to Home page, enter text in a textbox, log in using popUp and check if textbox text is retained as app does not get reloaded
1 : Start of Test
2 : Entering text in a textbox on the home page
3 : Verifying BrowserCache for id_token
4 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
5 : App is not reloaded in case of login using a popUp window
6 : logout method called
[13:02:41] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
7 : Logout button clicked
8 : Redirecting back to Home page after Logout
9 : Verifying if Msal cache entries are reset
10 : Log out Success
11 : End of Test

[31mF[0m8 :: Should login using redirect flow, navigate to external we api and check if token is served from the cache
1 : Start of Test
2 : Verifying BrowserCache for id_token
3 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
4 : Calling external web api
5 : Verifying BrowserCache for access_token
null
6 : logout method called
[13:03:04] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
7 : Logout button clicked
8 : Redirecting back to Home page after Logout
9 : Verifying if Msal cache entries are resetted
10 : Log out Success
11 : End of Test

[31mF[0m9 :: should navigate to a protected route(external web api) using redirect flow and check if user gets redirected to the login page. After successful authentication, user should get redirected back to the protected route
1 : Start of Test
2 : Navigating to a protected route without a signed-in user
3 : User gets redirected to the sign-in page
4 : Verifying BrowserCache for id_token
5 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'OWY0ODgwZDgtODBiYS00YzQwLTk3YmMtZjdhMjNjNzAzMDg0.ZjY0NWFkOTItZTM4ZC00ZDFhLWI1MTAtZDFiMDlhNzRhOGNh' }
6 : login start page is saved with the url of the protected route
7 : Verifying BrowserCache for access_token
null
8 : logout method called
[13:03:29] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
9 : Logout button clicked
10 : Redirecting back to Home page after Logout
11 : Verifying if Msal cache entries are resetted
12 : Log out Success
13 : End of Test

[31mF[0m10 :: Should login using redirect flow and MSA account, navigate to external we api and check if token is served from the cache
1 : Start of Test
2 : Verifying BrowserCache for id_token
3 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLWIzOTQtZjE3N2NhNGFjNjNl.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
4 : Calling external web api
5 : Verifying BrowserCache for access_token
null
6 : logout method called
[13:04:00] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
7 : End of Test

[31mF[0m11 :: Should login using redirect flow and MSA account, navigate to MS Graph and check if token is served from the cache
1 : Start of Test
2 : Verifying BrowserCache for id_token
3 : Getting access_token/id_token key for scope: 79d1dd3f-4de3-4b69-ac25-f2fc5eefe773 from storage
{ authority: 'https://login.microsoftonline.com/msidlab4.onmicrosoft.com/',
  clientId: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  scopes: '79d1dd3f-4de3-4b69-ac25-f2fc5eefe773',
  userIdentifier: 'MDAwMDAwMDAtMDAwMC0wMDAwLWIzOTQtZjE3N2NhNGFjNjNl.OTE4ODA0MGQtNmM2Ny00YzViLWIxMTItMzZhMzA0YjY2ZGFk' }
4 : Calling ms graph
5 : Verifying BrowserCache for access_token
null
null
6 : logout method called
[13:04:25] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
7 : End of Test

[31mF[0m12 :: Should login using redirect flow, remove expiration key for todo api access_token to 0, navigate to Todo page and check if token is renewed using iframe
1 : Start of Test
12 :: Should login using redirect flow, remove expiration key for todo api access_token to 0, navigate to Todo page and check if token is renewed using iframe
2 : Start of Test
3 : Calling external web api
4 : Verifying BrowserCache for access_token
null
5 : Removing accessToken key for Todo API
6 : Access token key deleted from cache
7 : Verifying BrowserCache for access_token
null
8 : logout method called
[13:04:58] W/element - more than one element found for locator By(xpath, .//*[.="Signed in"]) - the first result will be used
9 : Logout button clicked
10 : Redirecting back to Home page after Logout
11 : Verifying if Msal cache entries are resetted
12 : Log out Success
13 : End of Test

[31mF[0m

Failures:
1) E2ETests MSAL Angular 2 :: should login using popup and logout
  Message:
[31m    Expected 'Completed' to equal ''.[0m
  Stack:
    Error: Failed expectation
        at C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\helpers.js:146:56
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)

2) E2ETests MSAL Angular 3 :: Should login using redirect flow, navigate to Calendar tab (MS Graph API) and check if token is served from the cache
  Message:
[31m    Expected null not to be null.[0m
  Stack:
    Error: Failed expectation
        at C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:128:40
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)

3) E2ETests MSAL Angular 4 :: should navigate to a protected route(calendar) using redirect flow and check if user gets redirected to the login page. After successful authentication, user should get redirected back to the protected route
  Message:
[31m    Expected null not to be null.[0m
  Stack:
    Error: Failed expectation
        at C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:169:40
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)

4) E2ETests MSAL Angular 5 :: should login using popup flow, navigate to calendar tab and check if token is served from the cache
  Message:
[31m    Expected null not to be null.[0m
  Stack:
    Error: Failed expectation
        at C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:219:40
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)
  Message:
[31m    Expected 'Completed' to equal ''.[0m
  Stack:
    Error: Failed expectation
        at C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\helpers.js:146:56
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)

5) E2ETests MSAL Angular 7 :: should navigate to Home page, enter text in a textbox, log in using popUp and check if textbox text is retained as app does not get reloaded
  Message:
[31m    Expected 'Completed' to equal ''.[0m
  Stack:
    Error: Failed expectation
        at C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\helpers.js:146:56
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)

6) E2ETests MSAL Angular 8 :: Should login using redirect flow, navigate to external we api and check if token is served from the cache
  Message:
[31m    Expected null not to be null.[0m
  Stack:
    Error: Failed expectation
        at C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:370:40
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)

7) E2ETests MSAL Angular 9 :: should navigate to a protected route(external web api) using redirect flow and check if user gets redirected to the login page. After successful authentication, user should get redirected back to the protected route
  Message:
[31m    Expected null not to be null.[0m
  Stack:
    Error: Failed expectation
        at C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:408:40
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)

8) E2ETests MSAL Angular 10 :: Should login using redirect flow and MSA account, navigate to external we api and check if token is served from the cache
  Message:
[31m    Expected null not to be null.[0m
  Stack:
    Error: Failed expectation
        at C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:448:40
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)

9) E2ETests MSAL Angular 11 :: Should login using redirect flow and MSA account, navigate to MS Graph and check if token is served from the cache
  Message:
[31m    Expected null not to be null.[0m
  Stack:
    Error: Failed expectation
        at C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:481:40
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)

10) E2ETests MSAL Angular 12 :: Should login using redirect flow, remove expiration key for todo api access_token to 0, navigate to Todo page and check if token is renewed using iframe
  Message:
[31m    Expected null not to be null.[0m
  Stack:
    Error: Failed expectation
        at C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:517:40
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)
  Message:
[31m    Expected null not to be null.[0m
  Stack:
    Error: Failed expectation
        at C:\Users\neagrawa\repo\msalAngular\microsoft-authentication-library-for-js\lib\msalAngular\tests\endToEndTests\e2eTestsSpec.js:534:44
        at ManagedPromise.invokeCallback_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:1376:14)
        at TaskQueue.execute_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3084:14)
        at TaskQueue.executeNext_ (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:3067:27)
        at asyncRun (C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:2927:27)
        at C:\Users\neagrawa\AppData\Roaming\npm\node_modules\protractor\node_modules\selenium-webdriver\lib\promise.js:668:7
        at <anonymous>
        at process._tickCallback (internal/process/next_tick.js:188:7)

12 specs, 10 failures
Finished in 302.282 seconds

[13:05:05] I/launcher - 0 instance(s) of WebDriver still running
[13:05:05] I/launcher - Edge #01 failed 10 test(s)
[13:05:05] I/launcher - overall: 10 failed spec(s)
[13:05:05] E/launcher - Process exited with error code 1
