
Microsoft Authentication Library Preview for JavaScript (MSAL.js)
=========================================================

| [Getting Started](https://github.com/Azure-Samples/active-directory-javascript-singlepageapp-dotnet-webapi-v2 )| [Docs](https://aka.ms/aaddevv2) | [Library Reference](https://htmlpreview.github.io/?https://raw.githubusercontent.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/docs/classes/_useragentapplication_.useragentapplication.html) | [Support](README.md#community-help-and-support) | [Samples](./devApps/VanillaJSTestApp )
| --- | --- | --- | --- | --- |


The MSAL library preview for JavaScript enables your app to authorize enterprise users using Microsoft Azure Active Directory (AAD), Microsoft account users (MSA), users using social identity providers like Facebook, Google, LinkedIn etc. and get access to [Microsoft Cloud](https://cloud.microsoft.com) OR  [Microsoft Graph](https://graph.microsoft.io). 

The identity management services that the library interacts with are [Microsoft Azure Active Directory](https://azure.microsoft.com/en-us/services/active-directory/), [Microsoft Azure B2C](https://azure.microsoft.com/services/active-directory-b2c/) and [Microsoft Accounts](https://account.microsoft.com).


[![Build Status](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js.png?branch=dev)](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js)[![npm version](https://img.shields.io/npm/v/msal.svg?style=flat)](https://www.npmjs.com/package/msal)[![npm version](https://img.shields.io/npm/dm/msal.svg)](https://nodei.co/npm/msal/)

## Important Note about the MSAL Preview
This library is suitable for use in a production environment. We provide the same production level support for this library as we do our current production libraries. During the preview we may make changes to the API, internal cache format, and other mechanisms of this library, which you will be required to take along with bug fixes or feature improvements. This may impact your application. For instance, a change to the cache format may impact your users, such as requiring them to sign in again. An API change may require you to update your code. When we provide the General Availability release we will require you to update to the General Availability version within six months, as applications written using a preview version of library may no longer work.


## Example
This example shows how to acquire a token to read user information from Microsoft Graph.
1. Register an application in Azure AD v2.0 (using the [application registration portal](https://apps.dev.microsoft.com/)) to get your client_id. you will also need to add the Web platform, check the "Implicit Flow" checkbox, and add the redirectURI to your application.
2. Instantiate a UserAgentApplication and login the user:
```JavaScript
    <script class="pre">
        var applicationConfig = {
            clientID: 'your_client_id',
            graphScopes: ["user.read", "mail.send"]
        };
		
        var logger = new Msal.Logger(loggerCallback, { level: Msal.LogLevel.Verbose, correlationId:'12345' }); // level and correlationId are optional parameters.
		//Logger has other optional parameters like piiLoggingEnabled which can be assigned as shown aabove. Please refer to the docs to see the full list and their default values.
		
        function loggerCallback(logLevel, message, piiLoggingEnabled) {
            console.log(message);
        }

        var userAgentApplication = new Msal.UserAgentApplication(applicationConfig.clientID, null, authCallback, { logger: logger, cacheLocation: 'localStorage'}); //logger and cacheLocation are optional parameters.
		//userAgentApplication has other optional parameters like redirectUri which can be assigned as shown above.Please refer to the docs to see the full list and their default values.
        function authCallback(errorDesc, token, error, tokenType) {
            if (token) {
            }
            else {
                log(error + ":" + errorDesc);
            }
        }
    </script>
```
3. Then, once the user is logged-in, get an access token

```JavaScript
   <script>
    userAgentApplication.loginPopup(applicationConfig.graphScopes).then(function (idToken) {
                //Login Success
                userAgentApplication.acquireTokenSilent(applicationConfig.graphScopes).then(function (accessToken) {
                    //AcquireToken Success
                }, function (error) {
                    //AcquireToken Failure, send an interactive request.
                    userAgentApplication.acquireTokenPopup(applicationConfig.graphScopes).then(function (accessToken) {
                        updateUI();
                    }, function (error) {
                        console.log(error);
                    });
                })
            }, function (error) {
                console.log(error);
            });
    </script>
```

4. use the token in an [HTTP bearer request](https://github.com/Azure-Samples/active-directory-javascript-singlepageapp-dotnet-webapi-v2/blob/master/TodoSPA/App/Scripts/Ctrls/todoListCtrl.js#L30), to call the Microsoft Graph or a Web API

## Installation

Via NPM:

    npm install msal

Note that msal.js is built for ES5, therefore enabling support of Internet Explorer 11. If you want to target Internet Explorer, you'll need to add a reference to promises polyfill. You might want to read more in the [FAQ](../../wiki)
```JavaScript
    <!-- IE support: add promises polyfill before msal.js  -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.3.4/bluebird.min.js" class="pre"></script> 
```

## Build and running tests

If you want to build the library and run all the unit tests, you can do the following.

First navigate to the root directory of the library and install the dependencies:

	npm install
	
Then use the following command to build the library and run all the unit tests:

	npm run build

## Logging

You can enable logging in MSAL.js by passing a logger object when creating a UserAgentApplication instance as follows: 
```javascript
var logger = new Msal.Logger(loggerCallback, { level: Msal.LogLevel.Verbose });

var clientApplication = new Msal.UserAgentApplication(clientID, authority, authCallback, { logger: logger });

```
Implement the `loggerCallback` method depending on how you want to redirect logs. 
The supported log levels are: Error, Warning, Info, Verbose

#### Personal Identifiable Information (PII) & Organizational Identifiable Information (OII)

By default, MSAL.js logging does not capture or log any PII or OII. The library allows app developers to turn this on by configuring the `piiLoggingEnabled` flag on the log context. By turning on PII or OII, the app takes responsibility for safely handling highly-sensitive data and complying with any regulatory requirements.

```javascript
//PII or OII logging disabled. Default Logger does not capture any PII or OII
var logger = new Msal.Logger(loggerCallback, { level: Msal.LogLevel.Verbose, piiLoggingEnabled: false });
    
//PII or OII logging enabled
var logger = new Msal.Logger(loggerCallback, { level: Msal.LogLevel.Verbose, piiLoggingEnabled: true });

```
## Community Help and Support

- [FAQ](../../wiki) for access to our frequently asked questions

- [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) using tag MSAL.
We highly recommend you ask your questions on Stack Overflow first and browse existing issues to see if someone has asked your question before. 

- [GitHub Issues](../../issues) for reporting an bug or feature requests 

- [User Voice page](https://feedback.azure.com/forums/169401-azure-active-directory) to provide recommendations and/or feedback

## Contribute

We enthusiastically welcome contributions and feedback. You can clone the repo and start contributing now. 

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## Security Library

This library controls how users sign-in and access services. We recommend you always take the latest version of our library in your app when possible. We use [semantic versioning](http://semver.org) so you can control the risk associated with updating your app. As an example, always downloading the latest minor version number (e.g. x.*y*.x) ensures you get the latest security and feature enhanements but our API surface remains the same. You can always see the latest version and release notes under the Releases tab of GitHub.

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/en-us/security/dd252948) and subscribing to Security Advisory Alerts.


Copyright (c) Microsoft Corporation.  All rights reserved. Licensed under the MIT License (the "License");



## License

Copyright (c) Microsoft Corporation.  All rights reserved. Licensed under the MIT License (the "License");

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
