# Migrating from MSAL 2.x to MSAL 3.x

If you are new to MSAL, you should start [here](initialization.md).

If you are coming from [MSAL v1.x](../../msal-core/), you should check [this guide](v1-migration.md) first to migrate to [MSAL v2.x](../../msal-browser/) and then follow next steps.

If you are coming from [MSAL v2.x](../../msal-browser/), you can follow this guide to update your code to use [MSAL v3.x](../../msal-browser/).

## Breaking changes

### Application instantiation

In MSAL v2.x, you created an application instance as below:

```javascript
import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
    auth: {
        clientId: 'your_client_id'
    }
};

const msalInstance = new PublicClientApplication(msalConfig);
```

In MSAL v3.x, you must initialize the application object as well. There are several options at your disposal:

#### Option 1

Instantiate a `PublicClientApplication` object and initialize it afterwards. The `initialize` function is asynchronous and must resolve before invoking other MSAL.js APIs.

```javascript
import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
    auth: {
        clientId: 'your_client_id'
    }
};

const msalInstance = new PublicClientApplication(msalConfig);
await msalInstance.initialize();
```

#### Option 2

Invoke the `createPublicClientApplication` static method which returns an initialized `PublicClientApplication` object. Note that this function is asynchronous.

```javascript
import { PublicClientApplication } from "@azure/msal-browser";

const msalConfig = {
    auth: {
        clientId: 'your_client_id'
    }
};

const msalInstance = await PublicClientApplication.createPublicClientApplication(msalConfig);
```

### Claims-based caching

In MSAL v2.x, adding claims to a request will result in a hash of the requested claims string being added to the token cache key by default. This implies that MSAL 2.x caches and matches tokens based on claims by default. In MSAL v3.x, this behavior is no longer the default. MSAL v3.x default behavior is to go to the network to refresh a token every time claims are requested, regardless of whether the token has been cached previously and is still valid. Then, after going to the network, the token received overwrites the cached token in case a silent request without claims is executed later. In order to enable claims-based caching in MSAL v3.x to maintain the same behavior as in MSAL v2.x, developers must use the `cacheOptions.claimsBasedCachingEnabled` configuration flag set to true in the Client Application configuration object:

```typescript
const msalConfig = {
    auth: {
        ...
    },
    ...
    cache: {
        claimsBasedCachingEnabled: true
    }
}

const msalInstance = new msal.PublicClientApplication(msalConfig);
await msalInstance.initialize();
```

All other APIs are backward compatible with [MSAL v2.x](../../msal-browser/). It is recommended to take a look at the [default sample](../../../samples/msal-browser-samples/VanillaJSTestApp2.0) to see a working example of MSAL v3.0.

### Crypto

MSAL v3.x drops support for IE11 native crypto `window.msCrypto` and Microsoft Research JavaScript Cryptography Library (MSR crypto) `window.msrCrypto` in favor of native browser crypto API `window.crypto`.
Crypto options `config.system.cryptoOptions` that were used for MSR crypto are no longer supported as well.

## Key changes

### Browser support

MSAL.js no longer supports the following browsers:

- IE 11
- Edge (Legacy)

### Package dependencies

Typescript version was bumped from `3.8.3` to `4.9.5`.

### Compiler options

Module/target versions were bumped from `es6`/`es5` to `es2020`/`es2020` respectively.

### CDN

MSAL.js is no longer hosted on a CDN. Check [this doc](cdn-usage.md) for more details.
