
Microsoft Authentication Library Preview
=========================================================

| [Getting Started](https://github.com/Azure-Samples/active-directory-javascript-singlepageapp-dotnet-webapi-v2 )| [Docs](https://aka.ms/aaddevv2) | [Library Reference](https://htmlpreview.github.io/?https://raw.githubusercontent.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/docs/classes/_useragentapplication_.useragentapplication.html) | [Support](README.md#community-help-and-support) | [Samples](./devApps/VanillaJSTestApp )
| --- | --- | --- | --- | --- |


The MSAL library preview enables your app to authorize enterprise users using Microsoft Azure Active Directory (AAD), Microsoft account users (MSA), users using social identity providers like Facebook, Google, LinkedIn etc. and get access to [Microsoft Cloud](https://cloud.microsoft.com) OR  [Microsoft Graph](https://graph.microsoft.io). 

The identity management services that the library interacts with are [Microsoft Azure Active Directory](https://azure.microsoft.com/en-us/services/active-directory/), [Microsoft Azure B2C](https://azure.microsoft.com/services/active-directory-b2c/) and [Microsoft Accounts](https://account.microsoft.com).


[![Build Status](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js.png?branch=dev)](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js)[![npm version](https://img.shields.io/npm/v/msal.svg?style=flat)](https://www.npmjs.com/package/msal)[![npm version](https://img.shields.io/npm/dm/msal.svg)](https://nodei.co/npm/msal/)

## Important Note about the MSAL Preview
This library is suitable for use in a production environment. We provide the same production level support for this library as we do our current production libraries. During the preview we may make changes to the API, internal cache format, and other mechanisms of this library, which you will be required to take along with bug fixes or feature improvements. This may impact your application. For instance, a change to the cache format may impact your users, such as requiring them to sign in again. An API change may require you to update your code. When we provide the General Availability release we will require you to update to the General Availability version within six months, as applications written using a preview version of library may no longer work.

Microsoft Authentication Library provides 3 different libraries.

## Microsoft Authentication Library for Js
[MSAL](lib/msal-core/README.md)

## Microsoft Authentication Library for Angular
[MSAL-Angular](lib/msalAngular/README.md)

## Microsoft Authentication Library for Angularjs
[MSAL-Angularjs](lib/msalAngularjs/README.md)

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
