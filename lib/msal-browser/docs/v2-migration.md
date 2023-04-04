# Migrating from MSAL 2.x to MSAL 3.x

If you are new to MSAL, you should start [here](initialization.md).

If you are coming from [MSAL v1.x](../../msal-common/), you should check [this guide](v1-migration.md) first to migrate to [MSAL v2.x](../../msal-browser/).

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

In MSAL v3.x, you should initialize the application object as well. There are several options at your disposal:

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

All other APIs are backward compatible with [MSAL v2.x](../../msal-browser/). It is recommended to take a look at the [wam broker sample](../../../samples/msal-browser-samples/VanillaJSTestApp2.0/app/wamBroker) to see a working example of MSAL v3.0.
