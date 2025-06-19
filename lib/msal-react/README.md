# Microsoft Authentication Library for React (msal-react)

[![npm version](https://img.shields.io/npm/v/@azure/msal-react.svg?style=flat)](https://www.npmjs.com/package/@azure/msal-react/)
[![npm version](https://img.shields.io/npm/dm/@azure/msal-react.svg)](https://nodei.co/npm/@azure/msal-react/)
[![codecov](https://codecov.io/gh/AzureAD/microsoft-authentication-library-for-js/branch/dev/graph/badge.svg?flag=msal-react)](https://codecov.io/gh/AzureAD/microsoft-authentication-library-for-js)

| <a href="https://docs.microsoft.com/azure/active-directory/develop/tutorial-v2-react" target="blank">Getting Started</a> | <a href="https://aka.ms/aaddevv2" target="_blank">AAD Docs</a> | <a href="https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_react.html" target="_blank">Library Reference</a> | <a href="https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples" target="blank">Samples</a> |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |

1. [About](#about)
1. [FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/FAQ.md)
1. [Changelog](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/CHANGELOG.md)
1. [Prerequisites](#prerequisites)
1. [Version Support](#version-support)
1. [Installation](#installation)
1. [Build and Test](#build-and-test)
1. [Usage](#usage)
    - [Getting Started](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/getting-started.md)
    - [Msal Basics](#msal-basics)
    - [Advanced Topics](#advanced-topics)
    - [MSAL React Specific Concepts](#msal-react-specific-concepts)
1. [Samples](#samples)
1. [Security Reporting](#security-reporting)
1. [License](#license)
1. [Code of Conduct](#we-value-and-adhere-to-the-microsoft-open-source-code-of-conduct)

## About

The MSAL library for JavaScript enables client-side JavaScript applications to authenticate users using [Azure AD](https://docs.microsoft.com/azure/active-directory/develop/v2-overview) work and school accounts (AAD), Microsoft personal accounts (MSA) and social identity providers like Facebook, Google, LinkedIn, Microsoft accounts, etc. through [Azure AD B2C](https://docs.microsoft.com/azure/active-directory-b2c/active-directory-b2c-overview#identity-providers) service. It also enables your app to get tokens to access [Microsoft Cloud](https://www.microsoft.com/enterprise) services such as [Microsoft Graph](https://graph.microsoft.io).

The `@azure/msal-react` package described by the code in this folder uses the [`@azure/msal-browser` package](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-browser) as a peer dependency to enable authentication in Javascript Single-Page Applications without backend servers. This version of the library uses the OAuth 2.0 Authorization Code Flow with PKCE. To read more about this protocol, as well as the differences between implicit flow and authorization code flow, see the section in the [@azure/msal-browser readme](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/README.md#implicit-flow-vs-authorization-code-flow-with-pkce).

## Prerequisites

-   `@azure/msal-react` is meant to be used in [Single-Page Application scenarios](https://docs.microsoft.com/azure/active-directory/develop/scenario-spa-overview).

-   Before using `@azure/msal-react` you will need to [register a Single Page Application in Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-app-registration) to get a valid `clientId` for configuration, and to register the routes that your app will accept redirect traffic on.

## Version Support

| MSAL React version | MSAL support status | Supported React versions |
| ------------------ | ------------------- | ------------------------ |
| MSAL React v3      | Active development  | 16, 17, 18, 19           |
| MSAL React v1, v2  | In maintenance      | 16, 17, 18               |

**Note:** There have been no functional changes in the MSAL React v2 release.

## Installation

The MSAL React package is available on NPM.

```sh
npm install react react-dom
npm install @azure/msal-react @azure/msal-browser
```

## Build and Test

See the [`contributing.md`](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/contributing.md) file for more information.

### Building the package locally

To build the `@azure/msal-react` library, you can do the following:

```bash
// Install dev dependencies from root of repo
npm install
// Change to the msal-react package directory
cd lib/msal-react/
// To run build only for react package
npm run build
```

To build both the `@azure/msal-react` library and `@azure/msal-browser` libraries, you can do the following:

```bash
// Install dev dependencies from root of repo
npm install
// Change to the msal-react package directory
cd lib/msal-react/
// To run build for react and browser packages
npm run build:all
```

### Running Tests

`@azure/msal-react` uses [jest](https://jestjs.io/) to run unit tests and coverage.

```bash
// To run tests
npm test
// To run tests with code coverage
npm run test:coverage
```

## Usage

For help getting started with `@azure/msal-react` please see our [getting started](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/getting-started.md) doc.

Migrating from [react-aad-msal](https://www.npmjs.com/package/react-aad-msal)? Check out our [migration guide](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/migration-guide.md).

### MSAL Basics

Since `@azure/msal-react` is a wrapper around `@azure/msal-browser` many docs from the `msal-browser` repo are relevant here as well. For concepts specific to `@azure/msal-react` please see [below](#msal-react-specific-concepts)

1. [Initialization](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/initialization.md)
1. [Acquiring and using an access token](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/acquire-token.md)
1. [Managing token lifetimes](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/token-lifetimes.md)
1. [Managing Accounts](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md)
1. [Logging out](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/logout.md)

### Advanced Topics

-   [Configuration Options](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/configuration.md)
-   [Request and Response Details](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md)
-   [Events](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/events.md)
-   [Cache Storage](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/caching.md)
-   [Performance Enhancements](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/performance.md)

### MSAL React Specific Concepts

1. [Hooks](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/hooks.md)
1. [Events](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/events.md)
1. [Class Components](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/class-components.md)
1. [Performance](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/performance.md)

## Samples

Our [samples directory](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples) contains several example apps you can spin up to see how this library can be used in different contexts.

-   [Create React App (JS) Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/react-router-sample)
-   [Create React App (TS) Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/typescript-sample)
-   [Next.js Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/nextjs-sample)
-   [Gatsby Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/gatsby-sample)
-   [B2C Sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-react-samples/b2c-sample)

More advanced samples backed with a tutorial can be found in the [Azure Samples](https://github.com/Azure-Samples) space on GitHub:

-   [React SPA calling Express.js web API](https://github.com/Azure-Samples/ms-identity-javascript-react-tutorial/tree/main/3-Authorization-II/1-call-api)
-   [React SPA calling Express.js web API using App Roles and RBAC](https://github.com/Azure-Samples/ms-identity-javascript-react-tutorial/tree/main/5-AccessControl/1-call-api-roles)
-   [React SPA calling Microsoft Graph via Express.js web API using on-behalf-of flow](https://github.com/Azure-Samples/ms-identity-javascript-react-tutorial/tree/main/6-AdvancedScenarios/1-call-api-obo)
-   [Deployment tutorial for Azure Static Web Apps](https://github.com/Azure-Samples/ms-identity-javascript-react-tutorial/tree/main/4-Deployment/2-deploy-static)

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/security/dd252948) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License.

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
