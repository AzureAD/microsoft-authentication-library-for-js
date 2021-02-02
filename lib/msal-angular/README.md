# Microsoft Authentication Library for Angular


Note: `msal-angular@2` is under development. **We do not recommend using this version in a production environment yet**.

![npm (scoped)](https://img.shields.io/npm/v/@azure/msal-angular)![npm](https://img.shields.io/npm/dw/@azure/msal-angular)

| <a href="https://docs.microsoft.com/azure/active-directory/develop/tutorial-v2-angular" target="blank">Getting Started</a>| <a href="https://aka.ms/aaddevv2" target="_blank">AAD Docs</a> | <a href="https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_angular.html" target="_blank">Library Reference</a> | [Support](README.md#community-help-and-support) | <a href="https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples" target="blank">Samples</a>
| --- | --- | --- | --- | --- |

1. [About](#about)
2. [Guides](#guides)
3. [Version Support](#version-support)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Usage](#usage)
7. [Samples](#samples)
8. [Build and running tests](#build-and-running-tests)
9. [Versioning](#versioning)
10. [Community Help and Support](#community-help-and-support)
11. [Contribute](#contribute)
12. [Security Reporting](#security-reporting)
13. [License](#license)
14. [Code of Conduct](#we-value-and-adhere-to-the-microsoft-open-source-code-of-conduct)

## About

MSAL for Angular enables Angular web applications to authenticate users using [Azure AD](https://docs.microsoft.com/azure/active-directory/develop/v2-overview) work and school accounts (AAD), Microsoft personal accounts (MSA) and social identity providers like Facebook, Google, LinkedIn, Microsoft accounts, etc. through [Azure AD B2C](https://docs.microsoft.com/azure/active-directory-b2c/active-directory-b2c-overview#identity-providers) service. It also enables your app to get tokens to access [Microsoft Cloud](https://www.microsoft.com/enterprise) services such as [Microsoft Graph](https://graph.microsoft.io).

The `@azure/msal-angular` package described by the code in this folder wraps the [`@azure/msal-browser` package](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser) and uses it as a peer dependency to enable authentication in Angular Web Applications without backend servers. This version of the library uses the OAuth 2.0 Authorization Code Flow with PKCE. To read more about this protocol, as well as the differences between implicit flow and authorization code flow, see the description provided by [@azure/msal-browser](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser#implicit-flow-vs-authorization-code-flow-with-pkce). If you are looking for the version of the library that uses the implicit flow, please see the [`msal-angular-v1` library](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/msal-angular-v1/lib/msal-angular).

This is an improvement upon the current `msal-angular` library which will utilize the authorization code flow. Most features available in the old library will be available in this one, but there are nuances to the authentication flow in both. The `@azure/msal-angular` package does NOT support the implicit flow.

## Guides

- [Upgrade Guide (1.x-2.x)](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/1.x-2.x-upgrade-guide.md)
- [Upgrade Guide (0.x-1.x)](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v1-docs/0.x-1.x-upgrade-guide.md)
- [Configuration](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/configuration.md)

## Version Support

At a minimum, MSAL Angular will follow the [support schedule of the main Angular project](https://angular.io/guide/releases#support-policy-and-schedule). We may continue to support certain versions of Angular that are no under Active or LTS support from the main Angular project on a version-by-version basis, as defined below.

| MSAL Angular version | MSAL support status     | Supported Angular versions |
|----------------------|-------------------------|----------------------------|
| 2.x.x                | Active development      | 9, 10, 11                  |
| 1.x.x                | Active development      | 6, 7, 8, 9                 |
| 0.x.x                | In maintenance          | 4, 5                       |

## Prerequisites

Before using MSAL.js, [register an application in Azure AD](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app) to get your `clientId`.

## Installation

The MSAL Angular package is available on NPM:
```
npm install @azure/msal-browser @azure/msal-angular@alpha
```

## Usage

MSAL Angular Basics
1. [Initialization](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/initialization.md)
1. [Public APIs](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/public-apis.md)
1. [Using redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/redirects.md)
1. [Known issues](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/known-issues.md)

Advanced Topics
1. [Logging](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/logging.md)
1. [CORS API](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/cors-api.md)
1. [Multi-Tenant](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/multi-tenant.md)
1. [Security](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/security.md)
1. [Internet Explorer Support](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/ie-support.md)
1. [Events](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/events.md)
1. [Angular Universal and SSR](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/angular-universal.md)

All documentation for MSAL Angular v1 can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v1-docs/).

## Samples

### MSAL Angular 1.x Samples
* [Angular Quickstart](https://github.com/Azure-Samples/active-directory-javascript-singlepageapp-angular)
* [B2C Angular SPA](https://github.com/Azure-Samples/active-directory-b2c-javascript-angular-spa)
* [Angular v6](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/msal-angular-v1/samples/msal-angular-samples/angular6-sample-app)
* [Angular v7](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/msal-angular-v1/samples/msal-angular-samples/angular7-sample-app)
* [Angular v8](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/msal-angular-v1/samples/msal-angular-samples/angular8-sample-app)
* [Angular v9](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/msal-angular-v1/samples/msal-angular-samples/angular9-sample-app)

### MSAL Angular 2.x Samples
* [Angular v9](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular9-v2-sample-app)
* [Angular v10](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular10-sample-app)
* [Angular v11](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular11-sample-app)
* [Angular v11 B2C Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular11-b2c-sample)

## Build and running tests

If you want to build the library and run all the unit tests, you can do the following.

First navigate to the root directory of the library(msal-angular) and install the dependencies:

    npm install

Then use the following command to build the library and run all the unit tests:

    npm run build

    npm run test

## Versioning

This library controls how users sign-in and access services. We recommend you always take the latest version of our library in your app when possible. We use [semantic versioning](http://semver.org) so you can control the risk associated with updating your app. As an example, always downloading the latest minor version number (e.g. x._y_.x) ensures you get the latest security and feature enhanements but our API surface remains the same. You can always see the latest version and release notes under the Releases tab of GitHub.

## Community Help and Support

-   [Msal Browser FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md) for access to our frequently asked questions
-   [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) using tag "msal".
    We highly recommend you ask your questions on Stack Overflow first and browse existing issues to see if someone has asked your question before.
-   [GitHub Issues](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues/templates/edit) for reporting a bug or feature requests
-   [User Voice page](https://feedback.azure.com/forums/169401-azure-active-directory) to provide recommendations and/or feedback

## Contribute

We enthusiastically welcome contributions and feedback. Please read the [contributing guide](contributing.md) before you begin.

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/security/dd252948) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License (the "License").

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
