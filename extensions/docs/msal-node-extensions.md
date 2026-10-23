# Microsoft Authentication Extensions for Node

The Microsoft Authentication Extensions for Node offers secure mechanisms for client applications to perform cross-platform token cache serialization and persistence.

## Overview

MSAL Node requires developers to implement their own logic for persisting the token cache. The MSAL Node extensions provide a robust, secure, and configurable token cache persistence implementation across Windows, Mac, and Linux. It provides mechanisms for encrypting and accessing the token cache from multiple processes concurrently.

Supported platforms are Windows, Mac and Linux:

-   Windows - DPAPI is used for encryption.
-   MAC - The MAC KeyChain is used through npm keytar.
-   Linux - LibSecret is used for storing to "Secret Service" through npm keytar.

## Code

### Creating the persistence layer

API for creating the persistence layer will differ based on what platform you are targeting.

Alternatively, you can use the `createPersistence` API from [PersistenceCreator](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/extensions/msal-node-extensions/src/persistence/PersistenceCreator.ts) as it's a generic wrapper and selects the appropriate persistence method based on the platform/OS.

```js
const { ConfidentialClientApplication } = require("@azure/msal-node");
const {
    DataProtectionScope,
    PersistenceCreator,
    PersistenceCachePlugin,
} = require("@azure/msal-node-extensions");

const persistence = await PersistenceCreator.createPersistence({
    cachePath: "path/to/cache/file.json",
    dataProtectionScope: DataProtectionScope.CurrentUser,
    serviceName: "test-msal-electron-service",
    accountName: "test-msal-electron-account",
    usePlaintextFileOnLinux: false,
});
// Use the persistence object to initialize an MSAL ConfidentialClientApplication with cachePlugin
const cca = new ConfidentialClientApplication({
    auth: {
        clientId: "CLIENT_ID_HERE",
        clientSecret: process.env.CLIENT_SECRET,
    },
    cache: {
        cachePlugin: new PersistenceCachePlugin(persistence),
    },
});
```

This file and keychain persistence example is intended for local application scenarios. Confidential web apps that serve multiple users or run across multiple instances should use a per-user partitioned distributed cache instead of sharing one cache blob. See [Performance and security](../../lib/msal-node/docs/caching.md#performance-and-security) for partitioning guidance.

Alternatively, you can use below platform-specific options:

#### Windows:

```js
const {
    FilePersistenceWithDataProtection,
    DataProtectionScope,
    PersistenceCachePlugin,
} = require("@azure/msal-node-extensions");
const { ConfidentialClientApplication } = require("@azure/msal-node");

const cachePath = "path/to/cache/file.json";
const dataProtectionScope = DataProtectionScope.CurrentUser;
const optionalEntropy = ""; //specifies password or other additional entropy used to encrypt the data.
const windowsPersistence = await FilePersistenceWithDataProtection.create(
    cachePath,
    dataProtectionScope,
    optionalEntropy
);
// Use the persistence object to initialize an MSAL ConfidentialClientApplication with cachePlugin
const cca = new ConfidentialClientApplication({
    auth: {
        clientId: "CLIENT_ID_HERE",
        clientSecret: process.env.CLIENT_SECRET,
    },
    cache: {
        cachePlugin: new PersistenceCachePlugin(windowsPersistence),
    },
});
```

-   cachePath is the path in the file system where the encrypted cache file will be stored.
-   dataProtectionScope specifies the scope of the data protection - either the current user or the local machine. You do not need a key to protect or unprotect the data. If you set the scope to CurrentUser, only applications running on your credentials can unprotect the data; however, that means that any application running on your credentials can access the protected data. If you set the scope to LocalMachine, any full-trust application on the computer can unprotect, access, and modify the data.
-   optionalEntropy specifies password or other additional entropy used to encrypt the data.

The FilePersistenceWithDataProtection uses the Win32 CryptProtectData and CryptUnprotectData APIs. For more information on dataProtectionScope, or optionalEntropy, reference the documentation for those APIs.

#### Mac:

```js
const {
    KeychainPersistence,
    PersistenceCachePlugin,
} = require("@azure/msal-node-extensions");
const { ConfidentialClientApplication } = require("@azure/msal-node");

const cachePath = "path/to/cache/file.json";
const serviceName = "test-msal-electron-service";
const accountName = "test-msal-electron-account";
const macPersistence = await KeychainPersistence.create(
    cachePath,
    serviceName,
    accountName
);
// Use the persistence object to initialize an MSAL ConfidentialClientApplication with cachePlugin
const cca = new ConfidentialClientApplication({
    auth: {
        clientId: "CLIENT_ID_HERE",
        clientSecret: process.env.CLIENT_SECRET,
    },
    cache: {
        cachePlugin: new PersistenceCachePlugin(macPersistence),
    },
});
```

-   cachePath is **not** where the cache will be stored. Instead, the extensions update this file with dummy data to update the file's update time, to check if the contents on the keychain should be loaded or not. It is also used as the location for the lock file.
-   service name under which the cache is stored the keychain.
-   account name under which the cache is stored in the keychain.

#### Linux:

```js
const {
    LibSecretPersistence,
    PersistenceCachePlugin,
} = require("@azure/msal-node-extensions");
const { ConfidentialClientApplication } = require("@azure/msal-node");

const cachePath = "path/to/cache/file.json";
const serviceName = "test-msal-electron-service";
const accountName = "test-msal-electron-account";
const linuxPersistence = await LibSecretPersistence.create(
    cachePath,
    serviceName,
    accountName
);
// Use the persistence object to initialize an MSAL ConfidentialClientApplication with cachePlugin
const cca = new ConfidentialClientApplication({
    auth: {
        clientId: "CLIENT_ID_HERE",
        clientSecret: process.env.CLIENT_SECRET,
    },
    cache: {
        cachePlugin: new PersistenceCachePlugin(linuxPersistence),
    },
});
```

-   cachePath is **not** where the cache will be stored. Instead, the extensions update this file with dummy data to update the file's update time, to check if the contents on the secret service (Gnome Keyring for example) should be loaded or not. It is also used as the location for the lock file.
-   service name under which the cache is stored the secret service.
-   account name under which the cache is stored in the secret service.

#### All platforms

An unencrypted file persistence, which works across all platforms, is provided for convenience, although not recommended.

```js
const {
    FilePersistence,
    PersistenceCachePlugin,
} = require("@azure/msal-node-extensions");
const { ConfidentialClientApplication } = require("@azure/msal-node");

const filePath = "path/to/cache/file.json";
const filePersistence = await FilePersistence.create(filePath, loggerOptions);
// Pass the persistence to msal config's cachePlugin
const cca = new ConfidentialClientApplication({
    auth: {
        clientId: "CLIENT_ID_HERE",
        clientSecret: process.env.CLIENT_SECRET,
    },
    cache: {
        cachePlugin: new PersistenceCachePlugin(filePersistence),
    },
});
```

> :https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/e7ea9fd970c035aaee9f8d3c3d3196334fd1c0de/extensions/msal-node-extensions/src/persistence/FilePersistence.ts#L18: If file or directory has not been created, `FilePersistence.create()` will create the file and any directories in the path recursively.

### Passing lock options to the Cache plugin for concurrency

Create the PersistenceCachePlugin, by passing in the persistence object that was created in the previous step.

```js
const { PersistenceCachePlugin } = require("@azure/msal-node-extensions");

const persistenceCachePlugin = new PersistenceCachePlugin(windowsPersistence); // or any of the other ones.
```

To support concurrent access by multiple processess, the extensions use a file based lock. You can configure the retry number and retry delay for lock acquisition through CrossPlatformLockOptions.

```js
const {
    PersistenceCreator,
    PersistenceCachePlugin,
} = require("@azure/msal-node-extensions");
const { ConfidentialClientApplication } = require("@azure/msal-node");

const lockOptions = {
    retryNumber: 100,
    retryDelay: 50,
};

const persistence = await PersistenceCreator.createPersistence(
    persistenceConfiguration
);
const persistenceCachePlugin = new PersistenceCachePlugin(
    persistence,
    lockOptions
); // or any of the other ones
const cca = new ConfidentialClientApplication({
    auth: {
        clientId: "CLIENT_ID_HERE",
        clientSecret: process.env.CLIENT_SECRET,
    },
    cache: {
        cachePlugin: persistenceCachePlugin,
    },
});
```

### Setting the PersistenceCachePlugin on the MSAL Node configuration

Once you have a `PersistenceCachePlugin`, set it on the MSAL Node `ConfidentialClientApplication` [configuration](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#configuration) as shown below.

```js
import { ConfidentialClientApplication } from "@azure/msal-node";

const confidentialClientConfig = {
    auth: {
        clientId: "",
        authority: "",
        clientSecret: process.env.CLIENT_SECRET,
    },
    cache: {
        cachePlugin: persistenceCachePlugin,
    },
};

const cca = new ConfidentialClientApplication(confidentialClientConfig);
```

Example configuration:

authConfig.js:-

```js
const AAD_ENDPOINT_HOST = "https://login.microsoftonline.com/"; // include the trailing slash
const REDIRECT_URI = "ENTER_REDIRECT_URI";

const cachePath = "path/to/cache/file.json";

/*define persistence config based on the appropriate persistence you are using(e.g- FilePersistenceWithDataProtection, generic PersistenceCreateor, etc)*/

//defining persistence config for PersistenceCreator
const persistenceConfiguration = {
    cachePath,
    dataProtectionScope: DataProtectionScope.CurrentUser,
    serviceName: "test-msal-electron-service",
    accountName: "test-msal-electron-account",
    usePlaintextFileOnLinux: false,
}

  const msalConfig = {
    auth: {
        clientId: "CLIENT_ID_HERE",
        authority: `${AAD_ENDPOINT_HOST}TENANT_ID_HERE`,
          clientSecret: process.env.CLIENT_SECRET,
    },
    cache: {
        cachePlugin: null // set later in main.js as shown above
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: LogLevel.Verbose,
        },
    },
};
...

module.exports = {
  msalConfig: msalConfig,
  protectedResources: protectedResources,
  REDIRECT_URI: REDIRECT_URI,
  persistenceConfiguration
};

```
