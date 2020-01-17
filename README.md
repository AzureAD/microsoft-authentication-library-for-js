Microsoft Authentication Library for JavaScript (MSAL.js) (DRAFT)
=========================================================

| [Getting Started](https://docs.microsoft.com/en-us/azure/active-directory/develop/guidedsetups/active-directory-javascriptspa)| [AAD Docs](https://aka.ms/aaddevv2) | [Library Reference](https://htmlpreview.github.io/?https://raw.githubusercontent.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-core/docs/classes/_useragentapplication_.useragentapplication.html) | [Support](README.md#community-help-and-support) | [Samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/Samples)
| --- | --- | --- | --- | --- |


The MSAL library for JavaScript enables client-side JavaScript applications to authenticate users using [Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-overview) work and school accounts (AAD), Microsoft personal accounts (MSA) and social identity providers like Facebook, Google, LinkedIn, Microsoft accounts, etc. through [Azure AD B2C](https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-overview#identity-providers) service. It also enables your app to get tokens to access [Microsoft Cloud](https://www.microsoft.com/enterprise) services such as [Microsoft Graph](https://graph.microsoft.io).

[![Build Status](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js.png?branch=dev)](https://travis-ci.org/AzureAD/microsoft-authentication-library-for-js)[![npm version](https://img.shields.io/npm/v/@azure/msal-browser.svg?style=flat)](https://www.npmjs.com/package/msal-browser)[![npm version](https://img.shields.io/npm/dm/@azure/msal-browser.svg)](https://nodei.co/npm/msal/)

## Installation
### Via NPM:

    npm install @azure/msal-common

## Roadmap and What To Expect From This Library
MSAL support on Javascript is a collection of libraries. `msal-common` is the platform agnostic core library, and `msal-browser` is our core library for Single Page Applications (SPAs) without a backend. This library includes improvements for new browser requirements in Safari, as well as an updated token acquisition flow utilizing the OAuth 2.0 Authorization Code Flow.

Our goal is to communicate extremely well with the community and to take their opinions into account. We would like to get to a monthly minor release schedule, with patches comming as often as needed.  The level of communication, planning, and granularity we want to get to will be a work in progress.

Please check our [roadmap](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki#roadmap) to see what we are working on and what we are tracking next.

## OAuth 2.0 and the Implicit Flow vs Authorization Code Flow with PKCE
Msal used to only implement the [Implicit Grant Flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow), as defined by the OAuth 2.0 protocol and [OpenID](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc).

Our goal is that the library abstracts enough of the protocol away so that you can get plug and play authentication, but it is important to know and understand the implicit flow from a security perspective.
The implicit flow runs in the context of a web browser which cannot manage client secrets securely. It is optimized for single page apps and has one less hop between client and server so tokens are returned directly to the browser. These aspects make it naturally less secure.
These security concerns are mitigated per standard practices such as- use of short lived tokens (and so no refresh tokens are returned), the library requiring a registered redirect URI for the app, library matching the request and response with a unique nonce and state parameter.

However, recent discussion among the IETF community has uncovered numerous vulnerabilities in the implicit flow. The MSAL library will now support the Authorization Code Flow with PKCE for Browser-Based Applications without a backend web server. You can read more about the [disadvantages of the implicit flow here](https://tools.ietf.org/html/draft-ietf-oauth-browser-based-apps-04#section-9.8.6).

We plan to continue support for the implicit flow in the library.

## Usage
This library is not meant for production use. Please use one of these packages specific to the platform you are developing for:

- [MSAL for Single Page Applications (SPAs)](../msal-browser/README.md)

#### Prerequisite

Before using MSAL.js you will need to [register an application in Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app) to get a valid `clientId` for configuration, and to register the routes that your app will accept redirect traffic on.

> TBD

You can learn further details about MSAL.js functionality documented in the [MSAL Wiki](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki) and find complete [code samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/Samples).

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/en-us/security/dd252948) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation.  All rights reserved. Licensed under the MIT License (the "License");

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
