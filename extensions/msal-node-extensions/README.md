# Microsoft Authentication Extensions for Node

![npm (scoped)](https://img.shields.io/npm/v/@azure/msal-node-extensions)
![npm](https://img.shields.io/npm/dw/@azure/msal-node-extensions)

| <a href="https://docs.microsoft.com/azure/active-directory/develop/tutorial-v2-react" target="blank">Getting Started</a> | <a href="https://aka.ms/aaddevv2" target="_blank">AAD Docs</a> | <a href="https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_react.html" target="_blank">Library Reference</a> | <a href="https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples" target="blank">Samples</a>
|--- | --- | --- | --- |

1. [About](#about)
    - [Goals](#goals)
    - [Non-Goals](#non-goals)
1. [FAQ](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/extensions/docs/faq.md)
1. [Prerequisites](#prerequisites)
1. [Installation](#installation)
1. [Usage](#usage)
    - [Getting Started](#getting-started)
    - [Security Boundary](#security-boundary)
1. [Build and Test](#build-and-test)
    - [Build package](#building-the-package-locally)
    - [Test package](#running-tests)
1. [Samples](#samples)
1. [Security Reporting](#security-reporting)
1. [License](#license)
1. [Contributing](#contributing)
1. [Code of Conduct](#we-value-and-adhere-to-the-microsoft-open-source-code-of-conduct)

## About
The Microsoft Authentication Extensions for Node offers secure mechanisms for client applications to perform cross-platform token cache serialization and persistence. It gives additional support to the Microsoft Authentication Library for Node (MSAL).

[MSAL Node](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-node) supports an in-memory cache by default and provides the ICachePlugin interface to perform cache serialization, but does not provide a default way of storing the token cache to disk. Microsoft authentication extensions for node is default implementation for persisting cache to disk across different platforms.

Supported platforms are Windows, Mac and Linux:

- Windows - DPAPI is used for encryption.
- MAC - The MAC KeyChain is used.
- Linux - LibSecret is used for storing to "Secret Service".

> Note: It is recommended to use this library for cache persistence support for Public client applications such as Desktop apps only. In web applications, this may lead to scale and performance issues. Web applications are recommended to persist the cache in session.

### Goals
* Provide a robust, secure and configurable token cache persistence implementation across Windows, Mac and Linux for public client applications (rich clients, CLI applications etc.)
* Token cache storage can be accessed by multiple processes concurrently.

### Non Goals
* This implementation is not suitable for web app / web api scenarios, where storing the cache should be done in memory, Redis, Sql Server etc. Have a look at the [web samples](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples) for server-side implementations.

## Prerequisites 

The extensions contain prebuild binaries.
[node-gyp](https://github.com/nodejs/node-gyp) is used to compile addons for accessing system APIs. Installation requirements are listed on the [node-gyp README](https://github.com/nodejs/node-gyp#installation)

On linux, the library uses `libsecret` so you may need to install it. Depending on your distribution, you will need to run the following command:

- Debian/Ubuntu: `sudo apt-get install libsecret-1-dev`
- Red Hat-based: `sudo yum install libsecret-devel`
- Arch Linux: sudo `pacman -S libsecret`

## Installation

The `msal-node-extensions` package is available on NPM.

```bash
npm i @azure/msal-node-extensions --save
```
## Usage
### Getting started
Here is a code snippet on how to configure the token cache.

```js
const { 
    DataProtectionScope,
    Environment,
    PersistenceCreator,
    PersistenceCachePlugin,
} = require("@azure/msal-node-extensions");

// You can use the helper functions provided through the Environment class to construct your cache path
// The helper functions provide consistent implementations across Windows, Mac and Linux.
const cachePath = path.join(Environment.getUserRootDirectory(), "./cache.json");

const persistenceConfiguration = {
    cachePath,
    dataProtectionScope: DataProtectionScope.CurrentUser,
    serviceName: "<SERVICE-NAME>",
    accountName: "<ACCOUNT-NAME>",
    usePlaintextFileOnLinux: false,
}

// The PersistenceCreator obfuscates a lot of the complexity by doing the following actions for you :-
// 1. Detects the environment the application is running on and initializes the right persistence instance for the environment.
// 2. Performs persistence validation for you.
// 3. Performs any fallbacks if necessary.
PersistenceCreator
.createPersistence(persistenceConfiguration)
.then(async (persistence) => {
    const publicClientConfig = {
        auth: {
            clientId: "<CLIENT-ID>",
            authority: "<AUTHORITY>",
        },

        // This hooks up the cross-platform cache into MSAL
        cache: {
            cachePlugin: new PersistenceCachePlugin(persistence)
        }
    };

    const pca = new msal.PublicClientApplication(publicClientConfig);
    
    // Use the public client application as required...
});
```

All the arguments for the persistence configuration are explained below:
| Field Name | Description | Required For |
| ---------- | ----------- | ------------ |
| cachePath  | This is the path to the lock file the library uses to synchronize the reads and the writes | Windows, Mac and Linux |
| dataProtectionScope | Specifies the scope of the data protection on Windows either the current user or the local machine. | Windows |
| serviceName | This specifies the service name to be used on Mac and/or Linux | Mac and Linux |
| accountName | This specifies the account name to be used on Mac and/or Linux | Mac and Linux |
| usePlaintextFileOnLinux | This is a flag to default to plain text on linux if libsecret fails. Defaults to `false` | Linux |

### Security boundary
On Windows and Linux, the token cache is scoped to the user session, i.e. all applications running on behalf of the user can access the cache. Mac offers a more restricted scope, ensuring that only the application that created the cache can access it, and prompting the user if others apps want access.

## Build and Test

If you intend to contribute to the library visit the [`contributing section`](#contributing) for even more information on how.

### Building the package locally

To build the `@azure/msal-node-extensions` library, you can do the following:

```bash
// Install dev dependencies from root of repo
npm install
// Change to the msal-node-extensions package directory
cd extensions/msal-node-extensions 
// To run build only for node-extensions package
npm run build
```

To build both the `@azure/msal-node-extensions` library and `@azure/msal-common` libraries, you can do the following:

```bash
// Install dev dependencies from root of repo
npm install
// Change to the msal-react package directory
cd lib/msal-node-extensions/
// To run build for the common package
npm run build:common
// To run build for the msal-node-extensions package
npm run build
```

### Running Tests

`@azure/msal-node-extensions` uses [jest](https://jestjs.io/) to run unit tests and coverage.

```bash
// To run tests
npm test
```

## Samples
Have a look at a [simple auth-code app](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/extensions/samples/msal-node-extensions) using this token cache. We use this for testing on Windows, Mac and Linux.

## Security Reporting

If you find a security issue with our libraries or services please report it to [secure@microsoft.com](mailto:secure@microsoft.com) with as much detail as possible. Your submission may be eligible for a bounty through the [Microsoft Bounty](http://aka.ms/bugbounty) program. Please do not post security issues to GitHub Issues or any other public site. We will contact you shortly upon receiving the information. We encourage you to get notifications of when security incidents occur by visiting [this page](https://technet.microsoft.com/security/dd252948) and subscribing to Security Advisory Alerts.

## License

Copyright (c) Microsoft Corporation.  All rights reserved. Licensed under the MIT License.

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.

## We Value and Adhere to the Microsoft Open Source Code of Conduct

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.