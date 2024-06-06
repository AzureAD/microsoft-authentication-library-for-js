# Performance

Please refer to [msal-common/performance](../../msal-common/docs/performance.md) first, which outlines the techniques your application can use to improve the performance of token acquisition using MSAL. Read below for measuring performance in your apps.

## Measuring performance

Applications that want to measure the performance of authentication flows in MSAL.js can do so manually, or consume the performance measures taken by the library itself.
Consuming performance measurements requires setting performance client in [telemetry configuration options](./configuration.md#telemetry-config-options) and adding performance callback.

### Set telemetry performance client

```javascript
import { PublicClientApplication, BrowserPerformanceClient } from "@azure/msal-browser";

const msalConfig = {
    auth: {
        ...
    },
    cache: {
        ...
    },
    system: {
        ...
    }
}

const msalInstance = new PublicClientApplication({
    ...msalConfig,
    telemetry: {
        client: new BrowserPerformanceClient(msalConfig)
    }
});
msalInstance.initialize();
```

**Note**: You can pass your own performance telemetry client that implements [IPerformanceClient](../../msal-common/src/telemetry/performance/IPerformanceClient.ts) to customize telemetry management.

### Add performance callback

Applications can register a callback to receive performance measurements taken by the library. These measurement will include end-to-end measurements for top-level APIs, as well as measurements for important internal APIs.

**Note for MSFT first-party applications**: We will be publishing an internal build of `@azure/msal-browser` that is already instrumented to capture this telemetry. Contact us for more details.

#### Example

```typescript
const msalInstance = new PublicClientApplication(config);

msalInstance.addPerformanceCallback((events: PerformanceEvent[]) => {
    events.forEach(event => {
        console.log(event);
    });
});
```

Example event:

```typescript
const event: PerformanceEvent = {
    correlationId: "03cad3ff-6682-4e3d-a0b4-d517b531c718",
	durationMs: 1873,
	endPageVisibility: "hidden",
	fromCache: false,
	name: "acquireTokenSilent",
	startPageVisibility: "visible",
	startTimeMs: 1636414041888,
	success: true,
    silentCacheClientAcquireTokenDurationMs: 0,
    silentRefreshClientAcquireTokenDurationMs: 150,
    silentIframeClientAcquireTokenDurationMs: 0
    cryptoOptsGetPublicKeyThumbprintDurationMs: 200,
    cryptoOptsSignJwtDurationMs: 8,
    clientId: "b50703d7-d12b-4ddc-8758-91053fe0aba4",
    authority: "https://login.microsoftonline.com/common",
    libraryName: "@azure/msal-browser-1p",
    libraryVersion: "2.22.2-beta.2",
    appName: "my-application",
    appVersion: "1.0.0"
}
```

The complete details for `PerformanceEvents` objects can be found [here](../../msal-common/src/telemetry/performance/PerformanceEvent.ts). Below is a list of some notable properties:

| **Property**                       | Type      | Description                                                            |
| ---------------------------------- | --------- | ---------------------------------------------------------------------- |
| `name`                             | `string`  | Name of the operation, usually matches the top-level API name (e.g. `acquireTokenSilent`, `acquireTokenByCode`, `ssoSilent`). |
| `durationMs`                       | `number`  | End-to-end duration in milliseconds for the operation.                 |
| `success`                          | `boolean` | Whether the operation was successful or not.                           |
| `fromCache`                        | `boolean` | Whether the operation retrieved the result from the cache.             |
| `correlationId`                    | `string`  | Correlation ID used for the operation (preferably unique per request). |
| `libraryVersion`                   | `string`  | Version of MSAL.js used for the operation.                             |
| `authority`                        | `string`  | Authority used for the operation.                                      |
| `<internalFunctionName>DurationMs` | `number`  | Duration in milliseconds for an internal operation.                    |

### removePerformanceCallback

The `addPerformanceCallback` API will return a callback id, which an application can pass to `PublicClientApplication.removePerformanceCallback` to unregister that callback from receiving performance events. It will return a boolean indicating whether or not the callback was successfully removed.

#### Example

```typescript
const msalInstance = new PublicClientApplication(config);

const callbackId: string = msalInstance.addPerformanceCallback((events: PerformanceEvent[]) => {
    events.forEach(event => {
        console.log(event);
    });
});

const removed: boolean = msalInstance.removePerformanceCallback(callbackId);
```

### Measuring browser performance

Browser performance measurements are disabled by default due to significant performance overhead they impose.
Applications that want to enable performance measurements reported to the browser's performance timeline should:

1. Open browser developer tools
    - Edge, Chrome and Firefox browsers: press F12
    - Safari: go into Safari's preferences (`Safari Menu` > `Preferences`), select the `Advanced Tab` and enable `Show features for web developers`. Once that menu is enabled, you will find the developer console by clicking on `Develop` > `Show Javascript Console`
2. Navigate to `Session Storage`:
    - [Edge](https://learn.microsoft.com/en-us/microsoft-edge/devtools-guide-chromium/storage/sessionstorage)
    - [Chrome](https://developer.chrome.com/docs/devtools/storage/sessionstorage)
    - [Firefox](https://firefox-source-docs.mozilla.org/devtools-user/storage_inspector/local_storage_session_storage)
    - Safari: navigate to `Storage` tab and expand `Session Storage`
3. Select target domain
4. Add `msal.browser.performance.enabled` key to `Session Storage`, set it's value to `1`, refresh the page and check the browser's performance timeline.
