# Microsoft Authentication Library for JavaScript (MSAL.js) 2.0 for Browser-Based Single-Page Applications

[![npm version](https://img.shields.io/npm/v/@azure/msal-browser.svg?style=flat)](https://www.npmjs.com/package/@azure/msal-browser/)
[![npm version](https://img.shields.io/npm/dm/@azure/msal-browser.svg)](https://nodei.co/npm/@azure/msal-browser/)
[![codecov](https://codecov.io/gh/AzureAD/microsoft-authentication-library-for-js/branch/dev/graph/badge.svg?flag=msal-browser)](https://codecov.io/gh/AzureAD/microsoft-authentication-library-for-js)

| <a href="https://docs.microsoft.com/azure/active-directory/develop/guidedsetups/active-directory-javascriptspa" target="_blank">Getting Started</a> | <a href="https://aka.ms/aaddevv2" target="_blank">AAD Docs</a> | <a href="https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html" target="_blank">Library Reference</a> |
| --- | --- | --- |

1. [About](#about)
1. [FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md)
1. [Changelog](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/CHANGELOG.md)
1. [Roadmap](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/roadmap.md)
1. [Prerequisites](#prerequisites)
1. [Installation](#installation)
1. [Usage](#usage)
    - [Migrating from Previous MSAL Versions](#migrating-from-previous-msal-versions)
    - [MSAL Basics](#msal-basics)
    - [Advanced Topics](#advanced-topics)
1. [Samples](#samples)
1. [Build and Test](#build-and-test)
1. [Authorization Code vs Implicit](#implicit-flow-vs-authorization-code-flow-with-pkce)
1. [Framework Wrappers](#framework-wrappers)
1. [Security Reporting](#security-reporting)
1. [License](#license)
1. [Code of Conduct](#we-value-and-adhere-to-the-microsoft-open-source-code-of-conduct)

## About

The MSAL library for JavaScript enables client-side JavaScript applications to authenticate users using [Azure AD](https://docs.microsoft.com/azure/active-directory/develop/v2-overview) work and school accounts (AAD), Microsoft personal accounts (MSA) and social identity providers like Facebook, Google, LinkedIn, Microsoft accounts, etc. through [Azure AD B2C](https://docs.microsoft.com/azure/active-directory-b2c/active-directory-b2c-overview#identity-providers) service. It also enables your app to get tokens to access [Microsoft Cloud](https://www.microsoft.com/enterprise) services such as [Microsoft Graph](https://graph.microsoft.io).

The `@azure/msal-browser` package described by the code in this folder uses the [`@azure/msal-common` package](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-common) as a dependency to enable authentication in JavaScript Single-Page Applications without backend servers. This version of the library uses the OAuth 2.0 Authorization Code Flow with PKCE. To read more about this protocol, as well as the differences between implicit flow and authorization code flow, see the section [below](#implicit-flow-vs-authorization-code-flow-with-pkce). If you are looking for the version of the library that uses the implicit flow, please see the [`msal-core` library](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-core).

This is an improvement upon the current `msal-core` library which will utilize the authorization code flow in the browser. Most features available in the old library will be available in this one, but there are nuances to the authentication flow in both. The `@azure/msal-browser` package does NOT support the implicit flow.

## FAQ

See [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/FAQ.md).

## Roadmap

See [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/roadmap.md).

## Prerequisites

- `@azure/msal-browser` is meant to be used in [Single-Page Application scenarios](https://docs.microsoft.com/azure/active-directory/develop/scenario-spa-overview).

- Before using `@azure/msal-browser` you will need to [register a Single Page Application in Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-registration) to get a valid `clientId` for configuration, and to register the routes that your app will accept redirect traffic on.

## Installation

### Via NPM

```javascript
npm install @azure/msal-browser
```

### Via CDN

<!-- CDN_LATEST -->
```html
<script type="text/javascript" src="https://alcdn.msauth.net/browser/2.32.1/js/msal-browser.min.js"></script>
```

See [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/cdn-usage.md) for more info on how to use this package from the Microsoft CDN.

## Usage

### Migrating from Previous MSAL Versions

If you have MSAL v1.x currently running in your application, you can follow the instructions [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/v1-migration.md) to migrate your application to using the `@azure/msal-browser` package.

### MSAL Basics

1. [Initialization](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/initialization.md)
2. [Logging in a User](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md)
3. [Acquiring and Using an Access Token](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/acquire-token.md)
4. [Managing Token Lifetimes](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/token-lifetimes.md)
5. [Managing Accounts](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md)
6. [Logging Out a User](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/logout.md)

### Advanced Topics

- [Configuration Options](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md)
- [Request and Response Details](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md)
- [Cache Storage](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/caching.md)
- [Performance Enhancements](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/performance.md)
- [Instance Aware Flow](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/instance-aware.md)

## Samples

The [`msal-browser-samples` folder](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples) contains sample applications for our libraries.

- You can run any VanillaJSTestApp2.0 sample by changing the `authConfig.js` file in the respective folder to match your app registration and running the `npm` command `npm start -- -s <sample-name> -p <port>` in the VanillaJSTestApp2.0 folder.
- You can run the TypescriptTestApp2.0 sample by changing the `AuthModule.ts` file to match your app registration and running the `npm` command `npm start` in the TypescriptTestApp2.0 folder.

Additionally, the `msal-angular-v2-samples` folder contains an Angular 10 sample app that uses msal-browser.

- You can run the angular10-browser sample by changing the `app.module.ts` file to match your app registration and running the `npm` command `npm start` in the angular-10-browser-sample folder.

Here is a complete list of samples for the MSAL.js 2.x library:

| Sample | Description | How to Run |
| ------ | ----------- | ---------- |
| [TypeScript Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/TypescriptTestApp2.0) | A TypeScript sample showing usage of MSAL 2.0 with the Microsoft Graph API. | `npm start` |
| [Basic Auth Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/VanillaJSTestApp2.0/app/default) | A vanilla JavaScript sample showing basic usage of the MSAL 2.0 library (`@azure/msal-browser` package) with the Microsoft Graph API. | `npm start -- -s default` |
| [Multiple Resources Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/VanillaJSTestApp2.0/app/multipleResources) | A vanilla JS sample showing usage of MSAL 2.0 with authentication on page load with a redirect. | `npm start -- -s multipleResources` |
| [On Page Load Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/VanillaJSTestApp2.0/app/onPageLoad) | A vanilla JS sample showing usage of MSAL 2.0 with authentication on page load with a redirect. | `npm start -- -s onPageLoad` |
| [ssoSilent() Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/VanillaJSTestApp2.0/app/ssoSilent) | A vanilla JS sample showing usage of the ssoSilent API, allowing you to sign in a user silently if a context exists on the authentication server. | `npm start -- -s ssoSilent` |
| [Internet Explorer 11 Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/VanillaJSTestApp2.0/app/ie11-sample) | A vanilla JS sample showing usage of `@azure/msal-browser` in an application designed to run in Internet Explorer 11. | `npm start -- -s ie11-sample` |
| [Angular 10 Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-angular-v2-samples/angular10-browser-sample) | An Angular 10 sample showing usage of MSAL 2.0 with the Microsoft Graph API. | `npm start` |
| [Hybrid Spa Sample (w/ MSAL Node)](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/HybridSample) | Sample demonstrating how to use `acquireTokenByCode` to perform SSO for applications that leverage server-side and client-side authentication using MSAL Browser and MSAL Node. | `npm start` |
| [Vue 3 Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/vue3-sample-app) | A Vue 3 sample showing usage of MSAL 2.0 with the Microsoft Graph API. | `npm start` |

More instructions to run the samples can be found in the [`README.md` file](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/samples/msal-browser-samples/VanillaJSTestApp2.0/Readme.md) of the VanillaJSTestApp2.0 folder.

More advanced samples backed with a tutorial can be found in the [Azure Samples](https://github.com/Azure-Samples) space on GitHub:

- [JavaScript SPA calling Express.js web API](https://github.com/Azure-Samples/ms-identity-javascript-tutorial/tree/main/3-Authorization-II/1-call-api)
- [JavaScript SPA calling Microsoft Graph via Express.js web API using on-behalf-of flow](https://github.com/Azure-Samples/ms-identity-javascript-tutorial/tree/main/4-AdvancedGrants/1-call-api-graph)
- [Deployment tutorial for Azure App Service and Azure Storage](https://github.com/Azure-Samples/ms-identity-javascript-tutorial/tree/main/5-Deployment)

We also provide samples for addin/plugin scenarios:

- [Office Addin-in using MSAL.js](https://github.com/OfficeDev/PnP-OfficeAddins/blob/main/Samples/auth/Office-Add-in-Microsoft-Graph-React/)
- [Teams Tab using MSAL.js](https://github.com/pnp/teams-dev-samples/tree/main/samples/tab-sso/src/nodejs)
- [Chromium Extension using MSAL.js](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-browser-samples/ChromiumExtensionSample)

## Build and Test

See the [`contributing.md`](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/contributing.md) file for more information.

### Linking local package dependencies

If you are having issues with `lerna` and wish to use the local version of the `@azure/msal-common` library (to reflect changes made in both repositories) you can run do the following:

```bash
// Change to the msal-browser package directory
cd lib/msal-browser/
// Install package dependencies
npm install
// Change to the msal-common package directory
cd ../msal-common/
// Install package dependencies
npm install
// Prepare the local msal-common package for linking
npm link
// Change back to the msal-browser package directory
cd ../msal-browser/
// Link to the local build of msal-common
npm link @azure/msal-common
```

### Building the package

To build the `@azure/msal-browser` library, you can do the following:

```bash
// Change to the msal-browser package directory
cd lib/msal-browser/
// To run build only for browser package
npm run build
```

To build both the `@azure/msal-browser` library and `@azure/msal-common` libraries, you can do the following:

```bash
// Change to the msal-browser package directory
cd lib/msal-browser/
// To run build only for browser package
npm run build:all
```

### Running Tests

`@azure/msal-browser` uses [mocha](https://mochajs.org/) and [chai](https://www.chaijs.com/) to run unit tests, as well as Istanbul's [nyc](https://github.com/istanbuljs/nyc) tool for code coverage.

```bash
// To run tests
npm test
// To run tests with code coverage
npm run test:coverage:only
```

## Framework Wrappers

If you are using a framework such as Angular or React you may be interested in using one of our wrapper libraries:

- Angular: [@azure/msal-angular v2](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular)
- React: [@azure/msal-react](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)

## Implicit Flow vs Authorization Code Flow with PKCE

MSAL.js 1.x implemented the [Implicit Grant Flow](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-implicit-grant-flow), as defined by the OAuth 2.0 protocol and [OpenID](https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc).

Our goal is that the library abstracts enough of the protocol away so that you can get plug and play authentication, but it is important to know and understand the implicit flow from a security perspective. The MSAL 1.x client for single-page applications runs in the context of a web browser which cannot manage client secrets securely. It uses the implicit flow, which optimized for single-page applications and has one less hop between client and server so tokens are returned directly to the browser. These aspects make it naturally less secure. These security concerns are mitigated per standard practices such as: use of short lived tokens (and so no refresh tokens are returned), the library requiring a registered redirect URI for the app, and library matching the request and response with a unique nonce and state parameter. You can read more about the [disadvantages of the implicit flow here](https://tools.ietf.org/html/draft-ietf-oauth-browser-based-apps-04#section-9.8.6).

The MSAL library will now support the Authorization Code Flow with PKCE for Browser-Based Applications without a backend web server.
We plan to continue support for the implicit flow in the `msal-core` library.

You can learn further details about `@azure/msal-browser` functionality documented in our [docs folder](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser/docs) and find complete [code samples](#samples).

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/security/dd252948) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation.  All rights reserved. Licensed under the MIT License.

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
