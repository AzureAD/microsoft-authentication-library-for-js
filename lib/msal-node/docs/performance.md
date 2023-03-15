# Performance

Please refer to [msal-common/performance](../../msal-common/docs/performance.md) first, which outlines the techniques your application can use to improve the performance of token acquisition using MSAL. Read below for measuring performance in your apps and pitfalls to avoid.

## Measuring performance

Applications that want to measure the performance of authentication flows in MSAL Node can do so manually, using Node's [performance measurement APIs](https://nodejs.org/api/perf_hooks.html) or similar. Below is a list of some notable data points you can collect:

| Data | Meaning | Suggestions |
|--------|---------|--------------------------|
| `authType` | `acquireToken*` API used for the token request | Use for identifying usage. |
| `correlationId` |  Correlation ID used for the token request. You can obtain this via the `correlationId` property in [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#authenticationresult) |  Use for identifying usage. |
| `durationTotalInMs` | Total time spent in MSAL, including network calls and cache access | Alarm on overall high latency (> 1 second). Value depends on token source. From cache: one cache access. From network: two cache accesses plus two HTTP calls. |
| `durationInCacheInMs` | Time spent loading or saving the token cache persistence (e.g. Redis). | Alarm on spikes. |
| `durationInHttpInMs` | Time spent making HTTP calls to IdP (e.g. Azure AD). You can use a custom network client for more fine grained monitoring. See [Configuration](./configuration.md#system-config-options) and [custom network sample](../../../samples/msal-node-samples/custom-INetworkModule-and-network-tracing/) for more | Alarm on spikes. |
| `tokenSource` | Source of the token (i.e. cache vs network). You can obtain this via the `fromCache` property in [AuthenticationResult](https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_common.html#authenticationresult) | Tokens are retrieved from cache much faster (e.g. ~100 ms versus ~700 ms). Can be used to monitor and alarm cache hit ratio. Use together with `durationTotalInMs`. |

For example:

```javascript
    const { PerformanceObserver, performance } = require('node:perf_hooks');

    const perfObserver = new PerformanceObserver((items) => {
        items.getEntries().forEach((entry) => {
            console.log(entry);
        })
    });

    perfObserver.observe({ entryTypes: ["measure"], buffered: true });

    // ...

    performance.mark("acquireTokenByClientCredential-start");

    const tokenResponse = await msalInstance.acquireTokenByClientCredential({
        scopes: ["User.Read.All"],
    });

    performance.mark("acquireTokenByClientCredential-end");

    performance.measure("acquireTokenByClientCredential", {
        start: "acquireTokenByClientCredential-start"
        end: "acquireTokenByClientCredential-end"
        detail: {
            tokenSource: tokenResponse.fromCache
            correlationId: tokenResponse.correlationId
        }
    });
```

## Performance considerations for confidential client applications

Since confidential client applications are primarily used with server-side scenarios involving concurrent processing of requests, we recommend to scope MSAL `ConfidenticalClientApplication` (CCA) instances to each user, request or session.

A fresh CCA instance for each request means its default in-memory cache will initially not contain any tokens or metadata about how to acquire tokens. As such, the CCA instance you create should be prepared before the token request in order to avoid poor performance.

```typescript
import {
    ConfidentialClientApplication,
    AuthenticationResult,
    CryptoProvider,
    OnBehalfOfRequest
} from "@azure/msal-node";

function getMsalInstance(partitionKey: string): ConfidentialClientApplication {
    return new ConfidentialClientApplication({
        auth: {
            clientId: "ENTER_CLIENT_ID",
            authority: "http://login.microsoftonline.com/ENTER_TENANT_ID"
            cloudDiscoveryMetadata: "PROVIDE_STRINGIFIED_DISCOVERY_METADATA"
            authorityMetadata: "PROVIDE_STRINGIFIED_AUTHORITY_METADATA"
        },
        cache: {
            cachePlugin: new CustomCachePlugin(
                this.cacheClientWrapper,
                partitionKey
            )
        }
    });
};

async function getToken(tokenRequest: OnBehalfOfRequest): Promise<AuthenticationResult | null> {
    const partitionKey = await this.cryptoProvider.hashString(tokenRequest.oboAssertion);

    const cca = getMsalInstance(partitionKey);

    let tokenResponse = null;

    try {
        await cca.getTokenCache().getAllAccounts(); // required for cache read
        tokenResponse = await cca.acquireTokenOnBehalfOf(tokenRequest);
    } catch (error) {
        throw error;
    }

    return tokenResponse;
};
```

See [(CCA) Web API using a custom distributed cache plugin](../../../samples/msal-node-samples/auth-code-distributed-cache/README.md) for more.

## More information

* [Token caching in MSAL Node](caching.md)
* [MSAL Node configuration](configuration.md)
