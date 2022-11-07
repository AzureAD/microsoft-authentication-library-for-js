# Microsoft Authentication Library for Angular

![npm (scoped)](https://img.shields.io/npm/v/@azure/msal-angular)
![npm](https://img.shields.io/npm/dw/@azure/msal-angular)
[![codecov](https://codecov.io/gh/AzureAD/microsoft-authentication-library-for-js/branch/dev/graph/badge.svg?flag=msal-angular)](https://codecov.io/gh/AzureAD/microsoft-authentication-library-for-js)

| <a href="https://docs.microsoft.com/azure/active-directory/develop/tutorial-v2-angular-auth-code" target="blank">Getting Started</a>| <a href="https://aka.ms/aaddevv2" target="_blank">AAD Docs</a> | <a href="https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_angular.html" target="_blank">Library Reference</a> | [Support](README.md#community-help-and-support) | <a href="https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples" target="blank">Samples</a>
| --- | --- | --- | --- | --- |

1. [About](#about)
1. [Guides](#guides)
1. [FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/FAQ.md)
1. [Changelog](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/CHANGELOG.md)
1. [Version Support](#version-support)
1. [Prerequisites](#prerequisites)
1. [Installation](#installation)
1. [Usage](#usage)
1. [Samples](#samples)
1. [Build and running tests](#build-and-running-tests)
1. [Versioning](#versioning)
1. [Community Help and Support](#community-help-and-support)
1. [Contribute](#contribute)
1. [Security Reporting](#security-reporting)
1. [License](#license)
1. [Code of Conduct](#we-value-and-adhere-to-the-microsoft-open-source-code-of-conduct)

## About

MSAL for Angular enables Angular web applications to authenticate users using [Azure AD](https://docs.microsoft.com/azure/active-directory/develop/v2-overview) work and school accounts (AAD), Microsoft personal accounts (MSA) and social identity providers like Facebook, Google, LinkedIn, Microsoft accounts, etc. through [Azure AD B2C](https://docs.microsoft.com/azure/active-directory-b2c/active-directory-b2c-overview#identity-providers) service. It also enables your app to get tokens to access [Microsoft Cloud](https://www.microsoft.com/enterprise) services such as [Microsoft Graph](https://graph.microsoft.io).

The `@azure/msal-angular` package described by the code in this folder wraps the [`@azure/msal-browser` package](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser) and uses it as a peer dependency to enable authentication in Angular Web Applications without backend servers. This version of the library uses the OAuth 2.0 Authorization Code Flow with PKCE. To read more about this protocol, as well as the differences between implicit flow and authorization code flow, see the description provided by [@azure/msal-browser](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser#implicit-flow-vs-authorization-code-flow-with-pkce). If you are looking for the version of the library that uses the implicit flow, please see the [MSAL Angular v1 library](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/msal-angular-v1/lib/msal-angular).

The current `@azure/msal-angular` library improves upon the previous version and utilizes the authorization code flow. Most features available in the old library will be available in this one, but there are nuances to the authentication flow in both. The latest `@azure/msal-angular` package does NOT support the implicit flow.

## Guides

- [Upgrade Guide (v1-v2)](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/v1-v2-upgrade-guide.md)
- [Upgrade Guide (v0-v1)](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v1-docs/v0-v1-upgrade-guide.md)
- [Configuration](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/configuration.md)

## Version Support

At a minimum, `@azure/msal-angular` will follow the [support schedule of the main Angular project](https://angular.io/guide/releases#support-policy-and-schedule). We may continue to support certain versions of Angular that are not under Active or LTS support from the main Angular project on a version-by-version basis, as defined below.

| MSAL Angular version | MSAL support status     | Supported Angular versions |
|----------------------|-------------------------|----------------------------|
| MSAL Angular v2      | Active development      | 9, 10, 11, 12, 13, 14      |
| MSAL Angular v1      | Active development      | 6, 7, 8, 9                 |
| MSAL Angular v0      | In maintenance          | 4, 5                       |

## Prerequisites

Before using `@azure/msal-angular`, [register an application in Azure AD](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app) to get your `clientId`.

## Installation

The `@azure/msal-angular` package is available on NPM:
```
npm install @azure/msal-browser @azure/msal-angular@latest
```

## Usage

MSAL Angular Basics
1. [Initialization](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/initialization.md)
1. [Public APIs](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/public-apis.md)
1. [Using redirects](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/redirects.md)
1. [Using the MsalGuard](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/msal-guard.md)
1. [Using the MsalInterceptor](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/msal-interceptor.md)
1. [Known issues](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/known-issues.md)

Advanced Topics
1. [Logging](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/logging.md)
1. [Multi-Tenant](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/multi-tenant.md)
1. [Security](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/security.md)
1. [Internet Explorer Support](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/ie-support.md)
1. [Events](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/events.md)
1. [Angular Universal and SSR](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/angular-universal.md)
1. [Performance](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v2-docs/performance.md)

All documentation for MSAL Angular v1 can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular/docs/v1-docs/).

## Samples

### MSAL Angular v1 Samples
* [Angular v6](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/msal-angular-v1/samples/msal-angular-samples/angular6-sample-app)
* [Angular v7](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/msal-angular-v1/samples/msal-angular-samples/angular7-sample-app)
* [Angular v8](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/msal-angular-v1/samples/msal-angular-samples/angular8-sample-app)
* [Angular v9](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/msal-angular-v1/samples/msal-angular-samples/angular9-sample-app)

### MSAL Angular v2 Samples
* [Angular v9](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular9-v2-sample-app)
* [Angular v10](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular10-sample-app)
* [Angular v11](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular11-sample-app)
* [Angular v12](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular12-sample-app)
* [Angular v13 RxJS v6](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular13-rxjs6-sample-app)
* [Angular v13 RxJS v7](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular13-rxjs7-sample-app)
* [Angular v14 RxJS v6](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular14-rxjs6-sample-app)
* [Angular v14 RxJS v7](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular14-rxjs7-sample-app)
* [Angular v14 B2C Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular-b2c-sample-app)

See [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-angular-v2-samples/README.md) for specific features demonstrated by our MSAL Angular v2 samples.

### Advanced MSAL Angular v2 Samples
* [Angular SPA with ASP.NET Core web API](https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial/tree/main/3-Authorization-II/1-call-api)
* [Angular SPA with APS.NET Core web API using App Roles and RBAC](https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial/tree/main/5-AccessControl/1-call-api-roles)
* [Angular SPA calling Microsoft Graph via ASP.NET Core web API using on-behalf-of flow](https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial/tree/main/6-AdvancedScenarios/1-call-api-obo)
* [Multi-tenant tutorial using MSAL Angular v2](https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial/tree/main/6-AdvancedScenarios/2-call-api-mt)
* [Deployment tutorial using Azure App Service and Azure Storage](https://github.com/Azure-Samples/ms-identity-javascript-angular-tutorial/tree/main/4-Deployment)

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

We enthusiastically welcome contributions and feedback. Please read the [contributing guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/contributing.md) before you begin.

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/security/dd252948) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License (the "License").

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
