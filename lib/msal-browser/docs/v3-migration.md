# Migrating from MSAL v3 to MSAL v4

If you are new to MSAL, you should start [here](initialization.md).

If you are coming from MSAL v2, you should check [this guide](v2-migration.md) first to migrate to MSAL v3 and then follow next steps.

If you are coming from MSAL v3, you can follow this guide to update your code to use MSAL v4.

## API Breaking changes

### loadExternalTokens API is now async

The [`loadExternalTokens` API](testing.md) is now async and returns a Promise. If you are using this API you will need to update your code to await the resolution of the promise before using its result.

```js
const msalTokenCache = myMSALObj.getTokenCache();

// v3
const authenticationResult = msalTokenCache.loadExternalTokens(
    silentRequest,
    serverResponse,
    loadTokenOptions
);

// v4 change this to:
const authenticationResult = await msalTokenCache.loadExternalTokens(
    silentRequest,
    serverResponse,
    loadTokenOptions
);
```

### allowNativeBroker renamed to allowPlatformBroker

The `allowNativeBroker` configuration parameter has been renamed to `allowPlatformBroker`, if you are using device bound tokens you will need to update your configuration to continue using this feature. There are no other changes to behavior or default value. Read more about the platform broker [here](device-bound-tokens.md)

```js
// v3
const msalConfig = {
    auth: {
        clientId: "insert-clientId"
    },
    system: {
        allowNativeBroker: true
    }
};

// v4 change this to:
const msalConfig = {
    auth: {
        clientId: "insert-clientId"
    },
    system: {
        allowPlatformBroker: true
    }
};
```

## Behavioral Breaking Changes

The following changes do not require any code changes but are listed here as an FYI to changes in behavior of the library.

### LocalStorage Encryption

Starting in v4, if you are using the `localStorage` cache location, auth artifacts will be encrypted with [AES-GCM](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt#aes-gcm) using [HKDF](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/deriveKey#hkdf) to derive the key. The base key is stored in a session cookie titled `msal.cache.encryption`.

This cookie will be automatically removed when the browser instance (not tab) is closed, thus making it impossible to decrypt any auth artifacts after the session has ended. These expired auth artifacts will be removed the next time MSAL is initialized and the user may need to reauthenticate. The `localStorage` location still provides cross-tab cache persistence but will no longer persist across browser sessions.  

> [!Important]
> The purpose of this encryption is to reduce the persistence of auth artifacts, **not** to provide additional security. If a bad actor gains access to browser storage they would also have access to the key or have the ability to request tokens on your behalf without the need for cache at all. It is your responsibility to ensure your application is not vulnerable to XSS attacks [see below](#security)
