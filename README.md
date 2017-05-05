Microsoft Authentication Library
=====================================

| [Getting Started](https://aka.ms/aaddevv2)| [Docs](https://aka.ms/aaddevv2) | [API Reference](https://htmlpreview.github.io/?https://raw.githubusercontent.com/AzureAD/azure-activedirectory-library-for-js/dev/doc/index.html) | [Support](README.md#community-help-and-support) | [Sample](./devApps/VanillaJSTestApp )
| --- | --- | --- | --- | --- |


The MSAL library for JavaScript enables your app to authorize enterprise users using Microsoft Azure Active Directory(AAD), microsoft account users (MSA), users using social identity providers like Facebook, Google, LinkedIn etc. and get access to [Microsoft Cloud](https://cloud.microsoft.com) OR  [Microsoft Graph](https://graph.microsoft.io). 

The identity management services that the library interacts with are [Microsoft Azure Active Directoryy](https://azure.microsoft.com/en-us/services/active-directory/), [Microsoft Azure B2C](https://azure.microsoft.com/services/active-directory-b2c/) and [Microsoft Accounts](https://account.microsoft.com).

[![Build Status](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js.png?branch=dev)](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js)

MSAL for Javascript is in active development, but not yet ready. We encourage you to look at our work in progress and provide feedback!
**It should not be used in production environments.**

## Example

This is a 

`  <script class="pre">
        var userAgentApplication = new Msal.UserAgentApplication("your_client_id", null, function (errorDes, token, error, tokenType) {
              //this callback is called after loginredirect OR acquiretokenredirect
        });
        
        userAgentApplication.loginPopup("user.read").then( function(token) {
            var user = userAgentApplication.getUser();
            if (user) {
               //signin successful
            } else {
               //signin failure
            }
        }, function (error) {
            //handle error
        });
          //get an access token
          userAgentApplication.acquireTokenSilent("user.read").then(function (token) {
            console.log("ATS promise resolved");
          }, function (error) {
            //interaction required 
            if(error.indexOf("interaction_required" != -1) {
                userAgentApplication.acquireTokenPopup("mail.send").then(function (token) {
                //success
              }, function (error) {
                //error
               });
            }
          });
    </script>`

and larger documentation should go below, but really should be in docs.

## Installation

Via NPM:
    npm install msal

Via CDN:
    <!-- Latest compiled and minified JavaScript -->
    <script src="https://secure.aadcdn.microsoftonline-p.com/lib/0.1.0/js/msal.min.js"></script

## Community Help and Support

- [FAQ](../../wiki) for access to our frequently asked questions

- [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) using tag MSAL
We highly recommend you ask your questions on Stack Overflow first and browse existing issues to see if someone has asked your question before. 

- [GitHub Issues](../../issues) for reporting an bug or feature requests 

- [User Voice page](https://feedback.azure.com/forums/169401-azure-active-directory) to provide recommendations and/or feedback

## Contribute

We enthusiastically welcome contributions and feedback. You can clone the repo and start contributing now. Read our [Contribution Guide](Contributing.md) for more information.

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
