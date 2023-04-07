# Migrating from MSAL 2.x to MSAL 3.x

If you are new to MSAL, you should start [here](initialization.md).

If you are coming from [MSAL v1.x](../../msal-core/), you should check [this guide](v1-migration.md) first to migrate to [MSAL v2.x](../../msal-browser/) and then follow next steps.

If you are coming from [MSAL v2.x](../../msal-browser/), you can follow this guide to update your code to use [MSAL v3.x](../../msal-browser/).

## Update your code

In MSAL v2.x, you created an application instance as below:

```javascript
import * as msal from "@azure/msal-browser";

const msalConfig = {
    auth: {
        clientId: 'your_client_id'
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);
```

In MSAL v3.x, you must initialize the application object as well. There are several options at your disposal:

### Option 1

Instantiate a `PublicClientApplication` object and initialize it afterwards. The `initialize` function is asynchronous and must resolve before invoking other MSAL.js APIs.

```javascript
import * as msal from "@azure/msal-browser";

const msalConfig = {
    auth: {
        clientId: 'your_client_id'
    }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);
await msalInstance.initialize();
```

### Option 2

Invoke the `createPublicClientApplication` static method which returns an initialized `PublicClientApplication` object. Note that this function is asynchronous.

```javascript
import * as msal from "@azure/msal-browser";

const msalConfig = {
    auth: {
        clientId: 'your_client_id'
    }
};

const msalInstance = await msal.PublicClientApplication.createPublicClientApplication(msalConfig);
```

All other APIs are backward compatible with [MSAL v2.x](../../msal-browser/). It is recommended to take a look at the [default sample](../../../samples/msal-browser-samples/VanillaJSTestApp2.0) to see a working example of MSAL v3.0.

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
