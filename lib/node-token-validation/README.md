# Microsoft Identity Token Validation for Node (node-token-validation)

**NOTE: This library is currently a pre-release version under active development and should not be used.**

1. [About](#about)
1. [Changelog](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/node-token-validation/CHANGELOG.md)
1. [Node Version Support](#node-version-support)
1. [Installation](#installation)
1. [Usage](#usage)
1. [Samples](#samples)
1. [Build Library](#build-and-test)
1. [Security Reporting](#security-reporting)
1. [License](#license)
1. [Code of Conduct](#we-value-and-adhere-to-the-microsoft-open-source-code-of-conduct)

## About

Node Token Validation library enables token signature and claim validation for JWT tokens. This library is under active development and is not available for use yet.

## Node Version Support

Node Token Validation will follow the [Long Term Support (LTS) schedule of the Node.js project](https://nodejs.org/about/releases/). Our support plan is as follows.

Any major MSAL Node release:
- Will support stable (even-numbered) Maintenance LTS, Active LTS, and Current versions of Node
- Will drop support for any previously supported Node versions that have reached end of life
- Will not support prerelease/preview/pending versions until they are stable

| Node Token Validation version | Support status       | Supported Node versions |
|-------------------------------|----------------------|-------------------------|
| 1.x.x                         | Active development   | 18                      |

## Installation

### Building the package locally

To build the `@azure/node-token-validation` library, you can do the following:

```bash
// Install dev dependencies from root of repo
npm install
// Change to the node-token-validation package directory
cd lib/node-token-validation/
// Install package dependencies
npm install
// To run build only for node-token-validation package
npm run build
```

To build both the `@azure/node-token-validation` library and `@azure/msal-common` libraries, you can do the following:

```bash
// Install dev dependencies from root of repo
npm install
// Change to the node-token-validation package directory
cd lib/node-token-validation/
// Install package dependencies
npm install
// To run build for node-token-validation and common packages
npm run build:all
```

### Installing the package locally (current)

Install the package locally in your project

```json
"dependencies": {
  "@azure/node-token-validation": "file:{path}/lib/node-token-validation"
}
```

### Via NPM (forthcoming)

```javascript
npm install @azure/node-token-validation
```

## Usage

1. [Initialization](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/node-token-validation/docs/initialization.md)
1. [Configuration](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/node-token-validation/docs/configuration.md)

## Samples

There are multiple [samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/node-token-validation-samples) included in the repository that use Node Token Validation to validate tokens. These samples are currently used for manual testing, and are not meant to be a reference of best practices, therefore use judgement and do not blindly copy this code to any production applications.

- [basic-sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/node-token-validation-samples/basic-sample): Express application demonstrating token validation with manual token and claims set
- [express-sample](ttps://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/node-token-validation-samples/express-sample): Express.js MVC web application using MSAL Node to acquire tokens, and middleware-style token validation
- [response-sample](ttps://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/node-token-validation-samples/response-sample): Express application using MSAL Node 0Auth2.0 authorization code flow to acquire tokens, and validating tokens from response

## Build and Test

### Build

See build instructions under [Installation](#installation).

### Running Tests

`@azure/node-token-validation` uses [jest](https://jestjs.io/) to run unit tests and coverage.

```bash
// To run tests
npm test
// To run tests with code coverage
npm run test:coverage
```

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/security/dd252948) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation.  All rights reserved. Licensed under the MIT License.

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
