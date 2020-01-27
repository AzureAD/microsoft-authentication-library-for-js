
# Microsoft Authentication Library for JavaScript (MSAL.js)

1. [About](#about)
2. [Libraries](#core-and-wrapper-libraries)
3. [Samples](#samples)
4. [Roadmap](#roadmap)
5. [Community Help And Support](#community-help-and-support)
6. [Contribute](#contribute)
7. [Security Reporting](#security-reporting)
8. [License](#license)
9. [Code of Conduct](#we-value-and-adhere-to-the-microsoft-open-source-code-of-conduct)

## About

The Microsoft Authentication Library for JavaScript enables client-side JavaScript web applications, running in a web browser, to authenticate users using [Azure AD](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-overview) for work and school accounts (AAD), Microsoft personal accounts (MSA), and social identity providers like Facebook, Google, LinkedIn, Microsoft accounts, etc. through [Azure AD B2C](https://docs.microsoft.com/en-us/azure/active-directory-b2c/active-directory-b2c-overview#identity-providers) service. It also enables your app to get tokens to access [Microsoft Cloud](https://www.microsoft.com/enterprise) services such as [Microsoft Graph](https://graph.microsoft.io).

## Core and wrapper libraries

The [`lib`](./lib) folder contains the source code for all of our libraries. You will also find all the details about **installing the libraries**, in their respective README.md.

All of our libraries follow [semantic versioning](https://semver.org). We recommend using the latest version of each libary to ensure you have the latest security patches and bug fixes.

| Library | Description |
| ------- | ----------- |
| [Microsoft Authentication Library for JavaScript](lib/msal-core/README.md) | A browser-based, framework-agnostic core library that enables authentication and token acquisition with the Microsoft Identity platform in JavaScript applications. Implements the OAuth 2.0 [Implicit Grant Flow](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-implicit-grant-flow), and is [OpenID-compliant](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-protocols-oidc). |
| [Microsoft Authentication Library for Angular](lib/msal-angular/README.md) | A wrapper of the core library for apps using Angular framework. |
| [Microsoft Authentication Library for AngularJS](lib/msal-angularjs/README.md) | A wrapper of the core library for apps using AngularJS framework. |

## Samples

The [`samples`](./samples) folder contains sample applications for our libaries. For a complete list of samples, please go to the folder for that library (see [above](#core-and-wrapper-libraries) for links).

## Roadmap
What we are working on and future releases.

Timeline | Status | Release | Main features
| ------- | ------- | ------- | ---------
Dec 2019 | Complete | MSAL.js 1.2.X| (Production release) Authentication support for nested iframes, conditional access and sovereign clouds(specific to first party customers only). Checkout the latest [MSAL.js 1.2.1](./lib/msal-core/docs/msal-js-1.2.x.md).
Jan 2020 | In Progress (Beta Released) | MSAL Angular 1.0.0| Bringing MSAL-Angular up to date with msal-core 1.0.0 and ready to GA. Improvements and feature enhancements for MSAL Angular wrapper based on preview feedback. Please refer to list of [known issues and requests](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues?q=is%3Aopen+is%3Aissue+label%3Aangular). 
Feb 2020 | In Progress | MSAL.js 1.3.X| ssoSilent API / Integration / Unit testing improvements 
Mar 2020 | In Progress (Alpha Released) |  MSAL.js 2.0.0 | Supporting Authorization Code Flow with PKCE for Single Page Application
TBD | Not Started | MSAL.js B2C Enhancements |  Enhancements to usage of MSAL.js with Azure AD B2C. Please refer to list of [known issues and requests](https://github.com/AzureAD/microsoft-authentication-library-for-js/issues?q=is%3Aopen+is%3Aissue+label%3AB2C).
TBD | Not Started | MSAL Node.js Preview | Preview version of a server side authentication library for node.js.  Support of Oauth2 auth-code and device-code flow.
TBD | Not Started | MSAL React Preview | Preview version of a client side library for adding authentication to React applications.

## Community Help and Support

- [GitHub Issues](../../issues) is the best place to ask questions, report bugs, and new request features.

- [FAQs](./FAQ.md) for access to our frequently asked questions about the MSAL libraries. For library specific questions, please go to the folder for that library (see [above](#core-and-wrapper-libraries) for links).

- [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) using "msal" and "msal.js" tag.

- [User Voice page](https://feedback.azure.com/forums/169401-azure-active-directory) to provide recommendations and/or feedback.

## Contribute

We enthusiastically welcome contributions and feedback. Please read the [contributing guide](contributing.md) before you begin.

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/en-us/security/dd252948) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation.  All rights reserved. Licensed under the MIT License (the "License").

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
