
# Microsoft Authentication Library for JavaScript (MSAL.js) Core Library
[![npm version](https://img.shields.io/npm/v/msal.svg?style=flat)](https://www.npmjs.com/package/msal)[![npm version](https://img.shields.io/npm/dm/msal.svg)](https://nodei.co/npm/msal/)[![Coverage Status](https://coveralls.io/repos/github/AzureAD/microsoft-authentication-library-for-js/badge.svg?branch=dev)](https://coveralls.io/github/AzureAD/microsoft-authentication-library-for-js?branch=dev)

| <a href="https://docs.microsoft.com/azure/active-directory/develop/guidedsetups/active-directory-javascriptspa" target="_blank">Getting Started</a> | <a href="https://aka.ms/aaddevv2" target="_blank">AAD Docs</a> | <a href="https://azuread.github.io/microsoft-authentication-library-for-js/ref/msal-core/" target="_blank">Library Reference</a> |
| --- | --- | --- |

1. [About](#about)
2. [FAQ](./FAQ.md)
3. [Releases](#releases)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Usage](#usage)
7. [Samples](#samples)
8. [Implicit Flow](#oauth-2.0-and-the-implicit-flow)
9. [Security Reporting](#security-reporting)
10. [License](#license)
11. [Code of Conduct](#we-value-and-adhere-to-the-microsoft-open-source-code-of-conduct)

## About

The MSAL library for JavaScript enables client-side JavaScript web applications, running in a web browser, to authenticate users using [Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-overview) work and school accounts (AAD), Microsoft personal accounts (MSA) and social identity providers like Facebook, Google, LinkedIn, Microsoft accounts, etc. through [Azure AD B2C](https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-overview#identity-providers) service. It also enables your app to get tokens to access [Microsoft Cloud](https://www.microsoft.com/enterprise) services such as [Microsoft Graph](https://graph.microsoft.io).

## FAQ
See [here](./FAQ.md).

## Releases

*Expect us to detail our major and minor releases moving forward, while leaving out our patch releases.  Patch release notes can be found in our change log.*

Date | Release | Announcement | Main features
------| ------- | ---------| ---------
January 14, 2020 | MSAL.js 1.2.1 | [Release notes](https://github.com/AzureAD/microsoft-authentication-library-for-js/releases/tag/v1.2.1) | allow-forms added for sandboxed iframes, removing isAngular for redirect use cases
Dec 10th 2019 | MSAL.js 1.2.0 | [Release notes](https://github.com/AzureAD/microsoft-authentication-library-for-js/releases/tag/v1.2.0) | Authentication support for nested iframes, conditional access and sovereign clouds(first party customers specific)
July 23rd 2019 | MSAL.js 1.1.0 | [Release notes](https://github.com/AzureAD/microsoft-authentication-library-for-js/releases/tag/v1.1.0) | Add forceRefresh to skip cache, add claims to IdToken type, refactoring, fix bugs including esmodule compat with base64
May 3rd 2019  | MSAL.js 1.0.0  | [Release notes](https://github.com/AzureAD/microsoft-authentication-library-for-js/releases/tag/v1.0.0) | <li> API changes to support Configuration, Request, Response and Error object models to provide more control and access to parameters during token requests. Read [MSAL.js 1.0.0 with API changes released](MSAL.js-1.0.0-api-release) for details on usage.
January 4th 2019  | MSAL.js 0.2.4  | [Release notes](https://github.com/AzureAD/microsoft-authentication-library-for-js/releases/tag/v0.2.4) | <li> Support single sign on by removing default prompt parameter. See [prompt behavior](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-prompt-behavior) for details. <br> <li> Support shared cache format to allow migration from ADAL.js to MSAL.js without sign in prompts. Read [more here](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-sso).
September 11th 2018 | MSAL.js 0.2.3 | [Release notes](https://github.com/AzureAD/microsoft-authentication-library-for-js/releases/tag/v0.2.3) | <li> Fix for redirect flow issues on IE and Edge browsers. Read [more here](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/Known-issues-on-IE-and-Edge-Browser). <br><li> Support single sign on when not logged in with MSAL.js. Read [SSO with MSAL.js](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-js-sso).
September 10th 2018 | MSAL Angular 0.1.2 | [Readme](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angular) | Preview version of wrapper library for Angular (4.3 to 5) framework.
August 14th 2018 | MSAL AngularJS 0.1.1 | [Readme](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-angularjs) | Preview version of wrapper library for AngularJS framework.
Previous releases | MSAL.js 0.1.0 - 0.2.2 | [Releases](https://github.com/AzureAD/microsoft-authentication-library-for-js/releases) | |

## Prerequisites

- MSAL.js is meant to be used in [Single-Page Application scenarios](https://docs.microsoft.com/en-us/azure/active-directory/develop/scenario-spa-overview).
- Before using MSAL.js you will need to [register an application in Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app) to get a valid `clientId` for configuration, and to register the routes that your app will accept redirect traffic on.

## Installation
### Via NPM:

    npm install msal

### Via Latest Microsoft CDN Version (with SRI Hash):
#### Minified
```html
<script type="text/javascript" src="https://alcdn.msauth.net/lib/1.2.1/js/msal.min.js" integrity="sha384-Z4L5heyGO9VZ/MBCDx9GRtQW50Hrmp32ByIKuqwFesWyB+MDNy9ueVgclolfwj1Q" crossorigin="anonymous"></script>
```

#### Non-minified
```html
<script type="text/javascript" src="https://alcdn.msauth.net/lib/1.2.1/js/msal.js" integrity="sha384-9TV1245fz+BaI+VvCjMYL0YDMElLBwNS84v3mY57pXNOt6xcUYch2QLImaTahcOP" crossorigin="anonymous"></script>
```

See [here](./docs/cdn-usage.md) for alternate CDN links and more detail on Subresource Integrity Hashes.

Internet Explorer does not have native `Promise` support, and so you will need to include a polyfill for promises such as `bluebird`.

    <!-- IE support: add promises polyfill before msal.js  -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bluebird/3.3.4/bluebird.min.js"></script>

See here for more details on [supported browsers and known compatability issues](./FAQ.md#what-browsers-is-msaljs-supported-on).

## Usage

1. [Initialization](./docs/initialization.md)
2. [Login/Logout](./docs/login.md)
3. [Acquire and Renew Tokens](./docs/acquire-and-renew-tokens.md)
4. [Accounts](./docs/account-object.md)
5. [Using Tokens](./docs/using-tokens.md)
6. [Error Handling](./docs/error-handling.md)

### Advanced Topics

1. [Logging](./docs/logging.md)
2. [Single Sign-On](./docs/sso.md)

## Samples

The [`samples`](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples) folder contains sample applications for our libaries. Here is a complete list of samples for the MSAL.js 1.x Core library.

| Sample | Description |
| ------ | ----------- |
| [Vanilla JS Sample](./samples/VanillaJSTestApp) | Vanilla Javascript sample that shows a basic usage of the MSAL.js core library. |
| [JS Graph API V2 Sample](https://github.com/Azure-Samples/active-directory-javascript-graphapi-v2) | Javascript sample application used as the library quickstart which shows how to use the access token in a Graph API call. |
| [B2C JS SPA Sample](https://github.com/Azure-Samples/active-directory-b2c-javascript-msal-singlepageapp) | Javascript sample application showing how to use MSAL for B2C scenarios in a Single-Page Application. |
| [JS SPA w/ .NET backend](https://github.com/Azure-Samples/active-directory-javascript-singlepageapp-dotnet-webapi-v2) | Javascript sample application showing how to use MSAL for auth scenarios in a Single-Page Application using an ASP.NET backend. Also shows how to call APIs other than MS Graph. |
| [React Sample using MSAL.js Core 1.x Library](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/react-sample-app) | Javascript sample application written using the React framework and the MSAL.js Core 1.x library. |

## OAuth 2.0 and the Implicit Flow
MSAL.js 1.x implements the [Implicit Grant Flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow), as defined by the OAuth 2.0 protocol and is [OpenID](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc) compliant.

Our goal is that the library abstracts enough of the protocol away so that you can get plug and play authentication, but it is important to know and understand the implicit flow from a security perspective.
The implicit flow runs in the context of a web browser which cannot manage client secrets securely. It is optimized for single page apps and has one less hop between client and server so tokens are returned directly to the browser. These aspects make it naturally less secure.
These security concerns are mitigated per standard practices such as- use of short lived tokens (and so no refresh tokens are returned), the library requiring a registered redirect URI for the app, library matching the request and response with a unique nonce and state parameter.

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/en-us/security/dd252948) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation.  All rights reserved. Licensed under the MIT License (the "License");

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
