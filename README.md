 # Microsoft Authentication Library for JavaScript (MSAL.js)

The Microsoft Authentication Library for JavaScript enables both client-side and server-side JavaScript applications to authenticate users using [Microsoft Entra ID](https://docs.microsoft.com/azure/active-directory/develop/v2-overview) for work and school accounts, Microsoft personal accounts (MSA), and social identity providers like Facebook, Google, LinkedIn, Microsoft accounts, etc. through [Azure AD B2C](https://docs.microsoft.com/azure/active-directory-b2c/active-directory-b2c-overview#identity-providers) service. It also enables your app to get tokens to access [Microsoft Cloud](https://www.microsoft.com/enterprise) services such as [Microsoft Graph](https://graph.microsoft.io).

## Repository

### Core, wrapper and extensions libraries

The [`lib`](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib) folder contains the source code for our libraries in active development. You will also find all the details about **installing the libraries** in their respective README.md.

-   [Microsoft Authentication Library for JavaScript](lib/msal-browser/): A browser-based, framework-agnostic browser library that enables authentication and token acquisition with the Microsoft Identity platform in JavaScript applications. Implements the OAuth 2.0 [Authorization Code Flow with PKCE](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow), and is [OpenID-compliant](https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc).

-   [Microsoft Authentication Library for Node.js](lib/msal-node/): A [Node.js](https://nodejs.org/en/) library that enables authentication and token acquisition with the Microsoft Identity platform in JavaScript applications. Implements the following OAuth 2.0 protocols and is [OpenID-compliant](https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc):

    -   [Authorization Code Grant](https://oauth.net/2/grant-types/authorization-code/) with [PKCE](https://oauth.net/2/pkce/)
    -   [Device Code Grant](https://oauth.net/2/grant-types/device-code/)
    -   [Refresh Token Grant](https://oauth.net/2/grant-types/refresh-token/)
    -   [Client Credential Grant](https://oauth.net/2/grant-types/client-credentials/)
    -   [Silent Flow](https://docs.microsoft.com/azure/active-directory/develop/msal-acquire-cache-tokens#acquiring-tokens-silently-from-the-cache)
    -   [On-behalf-of Flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow)


-   [Native Authentication Support for JavaScript](lib/msal-browser/src/custom_auth/): MSAL also provides native authentication APIs that allow applications to implement a native experience with end-to-end customizable flows in their applications. With native authentication, users are guided through a rich, native, sign-up and sign-in journey without leaving the app. The native authentication feature is available for SPAs on [External ID for customers](https://learn.microsoft.com/en-us/entra/identity-platform/concept-native-authentication). It is recommended to always use the most up-to-date version of the SDK.

    > **Terminology:** In the codebase, the term "Custom Auth" is used instead of "Native Auth". You will find classes, interfaces, and configuration options prefixed with `CustomAuth` (e.g., `CustomAuthPublicClientApplication`, `CustomAuthConfiguration`). Please refer to these when implementing or exploring the native authentication feature in the code.

-   [Microsoft Authentication Library for React](lib/msal-react/): A wrapper of the msal-browser library for apps using React.
-   [Microsoft Authentication Library for Angular](lib/msal-angular/): A wrapper of the msal-browser library for apps using Angular framework.
-   [Microsoft Authentication Extensions for Node](extensions/msal-node-extensions/): The Microsoft Authentication Extensions for Node offers secure mechanisms for client applications to perform cross-platform token cache serialization and persistence. It gives additional support to the Microsoft Authentication Library for Node (MSAL).

### Library Version Support Status


| Package Name | Current Version | LTS Version | 
|--------------|-----------------|-------------|
| @azure/msal-browser |v5 | v4 |
| @azure/msal-node | v5 | v3 | 
| @azure/msal-react | v5 | v3 | 
| @azure/msal-angular | v5 | v4 |
| @azure/msal-node-extensions | v5 | v1 |
| ~~@azure/msal (msal-core)~~|  | Fully Deprecated  |
| ~~@azure/msal-angularjs~~ |  | Fully Deprecated  |

**Disambiguation:**
- The MSAL team provides full support to the current version for each package in the table below.
- LTS (long-term support) versions will still receive some support and critical bug-fixes but will not ship new features. Our recommendation if you encounter any issues will always be to upgrade to the latest version of the library.
- All supported packages were brought up to version parity as of `v5`. Packages with versions lower than `v4` in the LTS column skipped as many versions as required to jump directly to `v5`.

#### MSAL Browser CDN Deprecation

> :warning: The `@azure/msal-browser` CDN has been fully deprecated as of `@azure/msal-browser@3.0.0` and is no longer supported. App developers using the MSAL CDN must upgrade to the latest possible version and consume MSAL through a package manager or bundling tool of their choice. For more information on version support, consult the table above.


### Package Structure

We ship a number of different packages which are meant for different platforms. You can see the relationship between packages and their dependencies below.

![Package Structure](docs/diagrams/png/PackageStructure.png)

### Samples

The [`samples`](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples) folder contains sample applications for our libraries. A complete list of samples can be found in the respective package folders.

## Package versioning

All of our libraries follow [semantic versioning](https://semver.org). We recommend using the latest version of each library to ensure you have the latest security patches and bug fixes.

## Community Help and Support

-   [GitHub Issues](../../issues) is the best place to ask questions, report bugs, and new request features.

-   [FAQs](https://aka.ms/msaljs-faq) for access to our frequently asked questions.

-   [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) using "msal" and "msal.js" tag.

## Contribute

We enthusiastically welcome contributions and feedback. Please read the [contributing guide](contributing.md) before you begin.

## Security Reporting

If you find a security issue with our libraries or services [please report it to the Microsoft Security Response Center (MSRC)](https://aka.ms/report-security-issue) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://www.microsoft.com/msrc/technical-security-notifications) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License (the "License").

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
