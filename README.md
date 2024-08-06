# Microsoft Authentication Library for JavaScript (MSAL.js)

The Microsoft Authentication Library for JavaScript enables both client-side and server-side JavaScript applications to authenticate users using [Azure AD](https://docs.microsoft.com/azure/active-directory/develop/v2-overview) for work and school accounts (AAD), Microsoft personal accounts (MSA), and social identity providers like Facebook, Google, LinkedIn, Microsoft accounts, etc. through [Azure AD B2C](https://docs.microsoft.com/azure/active-directory-b2c/active-directory-b2c-overview#identity-providers) service. It also enables your app to get tokens to access [Microsoft Cloud](https://www.microsoft.com/enterprise) services such as [Microsoft Graph](https://graph.microsoft.io).

## Repository

### Core, wrapper and extensions libraries

The [`lib`](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib) folder contains the source code for our libraries in active development. You will also find all the details about **installing the libraries** in their respective README.md.

-   [Microsoft Authentication Library for Node.js](lib/msal-node/): A [Node.js](https://nodejs.org/en/) library that enables authentication and token acquisition with the Microsoft Identity platform in JavaScript applications. Implements the following OAuth 2.0 protocols and is [OpenID-compliant](https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc):

    -   [Authorization Code Grant](https://oauth.net/2/grant-types/authorization-code/) with [PKCE](https://oauth.net/2/pkce/)
    -   [Device Code Grant](https://oauth.net/2/grant-types/device-code/)
    -   [Refresh Token Grant](https://oauth.net/2/grant-types/refresh-token/)
    -   [Client Credential Grant](https://oauth.net/2/grant-types/client-credentials/)
    -   [Silent Flow](https://docs.microsoft.com/azure/active-directory/develop/msal-acquire-cache-tokens#acquiring-tokens-silently-from-the-cache)
    -   [On-behalf-of Flow](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-on-behalf-of-flow)

-   [Microsoft Authentication Library for JavaScript](lib/msal-browser/): A browser-based, framework-agnostic browser library that enables authentication and token acquisition with the Microsoft Identity platform in JavaScript applications. Implements the OAuth 2.0 [Authorization Code Flow with PKCE](https://docs.microsoft.com/azure/active-directory/develop/v2-oauth2-auth-code-flow), and is [OpenID-compliant](https://docs.microsoft.com/azure/active-directory/develop/v2-protocols-oidc).
-   [Microsoft Authentication Library for React](lib/msal-react/): A wrapper of the msal-browser library for apps using React.
-   [Microsoft Authentication Library for Angular](lib/msal-angular/): A wrapper of the msal-browser library for apps using Angular framework.
-   [Microsoft Authentication Extensions for Node](extensions/msal-node-extensions/): The Microsoft Authentication Extensions for Node offers secure mechanisms for client applications to perform cross-platform token cache serialization and persistence. It gives additional support to the Microsoft Authentication Library for Node (MSAL).

### Libraries in Long-term Support (LTS)

The following libraries, hosted on the `msal-lts` branch, are no longer in active development, but they are still receiving critical security bug fix support.

-   [Microsoft Authentication Library for JavaScript v2.x](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/msal-lts/lib/msal-browser)
-   [Microsoft Authentication Library for Node.js v1.x](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/msal-lts/lib/msal-node)
-   [Microsoft Authentication Library for React v1.x](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/msal-lts/lib/msal-react)
-   [Microsoft Authentication Library for Angular v2.x](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/msal-lts/lib/msal-angular)

### Package Structure

We ship a number of different packages which are meant for different platforms. You can see the relationship between packages and different authentication flows they implement below.

![Package Structure](docs/diagrams/png/PackageStructure.png)

### Samples

The [`samples`](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples) folder contains sample applications for our libraries. A complete list of samples can be found in the respective package folders or [on our wiki](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/Samples).

## Package versioning

All of our libraries follow [semantic versioning](https://semver.org). We recommend using the latest version of each library to ensure you have the latest security patches and bug fixes.

## Roadmap

Please check the [roadmap](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/roadmap.md) to see what we are working on and what we have planned for future releases.

## Community Help and Support

-   [GitHub Issues](../../issues) is the best place to ask questions, report bugs, and new request features.

-   [FAQs](https://github.com/AzureAD/microsoft-authentication-library-for-js/wiki/FAQs) for access to our frequently asked questions.

-   [Stack Overflow](http://stackoverflow.com/questions/tagged/msal) using "msal" and "msal.js" tag.

## Contribute

We enthusiastically welcome contributions and feedback. Please read the [contributing guide](contributing.md) before you begin.

## Security Reporting

If you find a security issue with our libraries or services [please report it to the Microsoft Security Response Center (MSRC)](https://aka.ms/report-security-issue) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://www.microsoft.com/msrc/technical-security-notifications) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT License (the "License").

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

test
