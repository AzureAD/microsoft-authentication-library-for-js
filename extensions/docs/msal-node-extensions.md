# Microsoft Authentication Extensions for Node
The Microsoft Authentication Extensions for Node offers secure mechanisms for client applications to perform cross-platform token cache serialization and persistence.

## Overview
MSAL Node requires developers to implement their own logic for persisting the token cache. The MSAL Node extensions aim to provide a robust, secure, and configurable token cache peristence implementation across Windows, Mac, and Linux for public client applications (Desktop clients, CLI applications , etc). It provides mechanisms for encrypting as well as accessing the token cache by multiple processess concurrently.

Supported platforms are Windows, Mac and Linux:

- Windows - DPAPI is used for encryption.
- MAC - The MAC KeyChain is used through npm keytar.
- Linux - LibSecret is used for storing to "Secret Service" through npm keytar.

## Code

### Creating the persistence layer

API for creating the persistence layer will differ based on what platform you are targeting.

Alternatively, you can use the `createPersistence` API from [PersistenceCreator](https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/extensions/msal-node-extensions/src/persistence/PersistenceCreator.ts) as it's a generic wrapper and selects the appropriate persistence method based on the platform/OS. 

```js
const { PublicClientApplication } = require("@azure/msal-node");
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
// Use the persistence object to initialize an MSAL PublicClientApplication with cachePlugin
const pca = new PublicClientApplication({
                auth: {
                        clientId: "CLIENT_ID_HERE",
                    },
                cache: {
                        cachePlugin: new PersistenceCachePlugin(persistence);
                    },
                });
```

Alternatively, you can use below platform-specific options:
#### Windows:
```js

const { FilePersistenceWithDataProtection, DataProtectionScope } = require("@azure/msal-node-extensions");
const { PublicClientApplication } = require("@azure/msal-node");

const cachePath = "path/to/cache/file.json";
const dataProtectionScope = DataProtectionScope.CurrentUser;
const optionalEntropy = ""; //specifies password or other additional entropy used to encrypt the data.
const windowsPersistence = await FilePersistenceWithDataProtection.create(cachePath, dataProtectionScope, optionalEntropy);
// Use the persistence object to initialize an MSAL PublicClientApplication with cachePlugin
const pca = new PublicClientApplication({
                auth: {
                        clientId: "CLIENT_ID_HERE",
                    },
                cache: {
                        cachePlugin: new PersistenceCachePlugin(windowsPersistence);
                    },
                });

```

- cachePath is the path in the file system where the encrypted cache file will be stored.
- dataProtectionScope specifies the scope of the data protection - either the current user or the local machine. You do not need a key to protect or unprotect the data. If you set the scope to CurrentUser, only applications running on your credentials can unprotect the data; however, that means that any application running on your credentials can access the protected data. If you set the scope to LocalMachine, any full-trust application on the computer can unprotect, access, and modify the data.
- optionalEntropy specifies password or other additional entropy used to encrypt the data.

The FilePersistenceWithDataProtection uses the Win32 CryptProtectData and CryptUnprotectData APIs. For more information on dataProtectionScope, or optionalEntropy, reference the documentation for those APIs.

#### Mac:
```js
const { KeychainPersistence } = require("@azure/msal-node-extensions");

const cachePath = "path/to/cache/file.json";
const serviceName = "test-msal-electron-service";
const accountName = "test-msal-electron-account";
const macPersistence = await KeychainPersistence.create(cachePath, serviceName, accountName);
// Use the persistence object to initialize an MSAL PublicClientApplication with cachePlugin
const pca = new PublicClientApplication({
                auth: {
                        clientId: "CLIENT_ID_HERE",
                    },
                cache: {
                        cachePlugin: new PersistenceCachePlugin(macPersistence);
                    },
                });

```

- cachePath is **not** where the cache will be stored. Instead, the extensions update this file with dummy data to update the file's update time, to check if the contents on the keychain should be loaded or not. It is also used as the location for the lock file.
- service name under which the cache is stored the keychain.
- account name under which the cache is stored in the keychain.

#### Linux:
```js
const { LibSecretPersistence } = require("@azure/msal-node-extensions");

const cachePath = "path/to/cache/file.json";
const serviceName = "test-msal-electron-service";
const accountName = "test-msal-electron-account";
const linuxPersistence = await LibSecretPersistence.create(cachePath, serviceName, accountName);
// Use the persistence object to initialize an MSAL PublicClientApplication with cachePlugin
const pca = new PublicClientApplication({
                auth: {
                        clientId: "CLIENT_ID_HERE",
                    },
                cache: {
                        cachePlugin: new PersistenceCachePlugin(linuxPersistence);
                    },
                });

```

- cachePath is **not** where the cache will be stored. Instead, the extensions update this file with dummy data to update the file's update time, to check if the contents on the secret service (Gnome Keyring for example) should be loaded or not. It is also used as the location for the lock file.
- service name under which the cache is stored the secret service.
- account name under which the cache is stored in the secret service.

#### All platforms
An unencrypted file persistence, which works across all platforms, is provided for convenience, although not recommended.

```js
const { FilePersistence } = require("@azure/msal-node-extensions");

const filePath = "path/to/cache/file.json";
const filePersistence = await FilePersistence.create(filePath, loggerOptions);
// Pass the persistence to msal config's cachePlugin
const pca = new PublicClientApplication({
    auth: {
            clientId: "CLIENT_ID_HERE",
        },
    cache: {
            cachePlugin: new PersistenceCachePlugin(filePersistence);
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

const lockOptions = {
    retryNumber: 100,
    retryDelay: 50
}

const persistence = await PersistenceCreator.createPersistence(persistenceConfiguration);
const persistenceCachePlugin = new PersistenceCachePlugin(persistence, lockOptions); // or any of the other ones
const pca = new PublicClientApplication({
    auth: {
            clientId: "CLIENT_ID_HERE",
        },
    cache: {
            cachePlugin: persistenceCachePlugin
        },
    });

```

### Setting the PersistenceCachePlugin on the MSAL Node PublicClientApplication configuration (with an example)
To summarize, once you have a `PersistenceCachePlugin`, that can be set on the MSAL Node `PublicClientApplication`, by setting it as part of the [configuration](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#configuration) object as shown below.

```js
import { PublicClientApplication } from "@azure/msal-node";

const publicClientConfig = {
    auth: {
        clientId: "",
        authority: "",
    },
    cache: {
        cachePlugin: persistenceCachePlugin
    },
};

const pca = new PublicClientApplication(publicClientConfig);
```

Example (for Electron node-js desktop app):-

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




### Note for Electron Developers:
Electron sample :
This [sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/extensions/samples/electron-webpack) depicts how to integrate the msal-node-extensions library to your electron application that has been bundled by webpack.

If you are using this extension for Electron, you might face an error similar to this:
```
Uncaught Exception:
Error: The module
"<path-to-project>\node_modules\...\dpapi.node" was compiled against a different Node.js version using NODE_MODULE_VERSION 85. This version of Node.js requires NODE_MODULE_VERSION 80. Please try re-compiling or re-installing the module...."
```
This error is probably due to Node.js version differences between the Electron project and the extension. This can be handled by re-building the package with the following steps:
- Install ```electron-rebuild``` with the command ```npm i -D electron-rebuild``` if you don't already have it installed.
- Remove ```packages-lock.json``` from your project if it exists
- Run ```./node_modules/.bin/electron-rebuild```


### Samples
1) [Electron-webpack sample for persistence](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/extensions/samples/electron-webpack)
2) [Msal-node extensions sample](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/extensions/samples/msal-node-extensions)