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
Creating the persistence will differ based on what platform you are targeting.

#### Windows:
```js
import { FilePersistenceWithDataProtection, DataProtectionScope } from "@azure/msal-node-extensions";

const cachePath = "path/to/cache/file.json";
const dataProtectionScope = DataProtectionScope.CurrentUser;
const optinalEntropy = "";
const windowsPersistence = FilePersistenceWithDataProtection.create(cachePath, dataProtectionScope, optionalEntropy);
```

- cachePath is the path in the file system where the encrypted cache file will be stored.
- dataProtectionScope specifies the scope of the data protection - either the current user or the local machine. You do not need a key to protect or unprotect the data. If you set the scope to CurrentUser, only applications running on your credentials can unprotect the data; however, that means that any application running on your credentials can access the protected data. If you set the scope to LocalMachine, any full-trust application on the computer can unprotect, access, and modify the data.
- optionalEntropy specifies password or other additional entropy used to encrypt the data.

The FilePersistenceWithDataProtection uses the Win32 CryptProtectData and CryptUnprotectData APIs. For more information on dataProtectionScope, or optionalEntropy, reference the documentation for those APIs.

#### Mac:
```js
import { KeychainPersistence } from "@azure/msal-node-extensions";

const cachePath = "path/to/cache/file.json";
const serviceName = "";
const accountName = "";
const macPersistence = KeychainPersistence.create(cachePath, serviceName, accountName);
```

- cachePath is **not** where the cache will be stored. Instead, the extensions update this file with dummy data to update the file's update time, to check if the contents on the keychain should be loaded or not. It is also used as the location for the lock file.
- service name under which the cache is stored the keychain.
- account name under which the cache is stored in the keychain.

#### Linux:
```js
import { LibSecretPersistence } from "@azure/msal-node-extensions";

const cachePath = "path/to/cache/file.json";
const serviceName = "";
const accountName = "";
const linuxPersistence = LibSecretPersistence.create(cachePath, serviceName, accountName);

```

- cachePath is **not** where the cache will be stored. Instead, the extensions update this file with dummy data to update the file's update time, to check if the contents on the secret service (Gnome Keyring for example) should be loaded or not. It is also used as the location for the lock file.
- service name under which the cache is stored the secret service.
- account name under which the cache is stored in the secret service.

#### All platforms
An unencrypted file persistence, which works across all platforms, is provided for convenience, although not recommended.

```js
import { FilePersistence } from "@azure/msal-node-extensions";

const cachePath = "path/to/cache/file.json";
const filePersistence = FilePersistence.create(cachePath, serviceName, accountName);
```

### Creating the cache plugin
Create the PersistenceCachePlugin, by passing in the persistence object that was created in the previous step.

```js
import { PersistenceCachePlugin } from "@azure/msal-node-extensions";

const persistenceCachePlugin = new PersistenceCachePlugin(windowsPersistence); // or any of the other ones.
```

To support concurrent access my multiple processess, the extensions use a file based lock. You can configure the retry number and retry delay for lock acquisition through CrossPlatformLockOptions.

```js
import { PersistenceCachePlugin } from "@azure/msal-node-extensions";

const lockOptions = {
    retryNumber: 100,
    retryDelay: 50
}
const persistenceCachePlugin = new PersistenceCachePlugin(windowsPersistence, lockOptions); // or any of the other ones.
```

### Setting the PersistenceCachePlugin on the MSAL Node PublicClientApplication configuration
Once you have a PersistenceCachePlugin, that can be set on the MSAL Node PublicClientApplication, by setting it as part of the configuration.

```js
import { PublicClientApplication } from "@azure/msal-node";

const publicClientConfig = {
    auth: {
        clientId: "",
        authority: "",
    },
    cache: {
        cachePlugin: persistenceCachePlugin;
    },
};

const pca = new PublicClientApplication(publicClientConfig);
```

Note that MSAL will not read and write to persistence by default. You will have to call PublicClientApplication.tokenCache.readFromPersistence() and PublicClientApplication.tokenCache.writeToPersistence() anytime you trigger and MSAL Node operation that alters the token cache.

### Note for Electron Developers:
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
