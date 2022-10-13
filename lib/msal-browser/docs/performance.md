# Performance

This document will outline techniques your application can use to improve the performance of token acquisition using MSAL.js.

## Bypass cloud instance discovery resolution

**Note:** This section does not apply if you are using B2C, ADFS or dSTS authorities. You will need to provide your authority domains to the `auth.knownAuthorities` property instead.

By default, during the process of retrieving a token, MSAL.js will make a network request to retrieve metadata associated with the various Azure clouds. If you would like to skip this network request, you can provide the required metadata in the configuration of `PublicClientApplication`.

**Important:** It is your application's responsibility to ensure it is using correct, up-to-date cloud instance metadata. Failure to do so may result in your application not working correctly.

Instructions (AAD Scenarios):

Instance Discovery Endpoint: `https://login.microsoftonline.com/common/discovery/instance?api-version=1.1&authorization_endpoint=https://login.microsoftonline.com/common/oauth2/v2.0/authorize`

1. Make a request to the instance discovery endpoint above
2. Provide the **entire** JSON response to the `auth.cloudDiscoveryMetadata` property.

**Note** If none of the aliases listed in the response match your authority you should pass your authority domain in `auth.knownAuthorities` instead.

Example:

```js
const msalInstance = new msal.PublicClientApplication({
    auth: {
        cloudDiscoveryMetadata: '{"tenant_discovery_endpoint":"https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration","api-version":"1.1","metadata":[{"preferred_network":"login.microsoftonline.com","preferred_cache":"login.windows.net","aliases":["login.microsoftonline.com","login.windows.net","login.microsoft.com","sts.windows.net"]},{"preferred_network":"login.partner.microsoftonline.cn","preferred_cache":"login.partner.microsoftonline.cn","aliases":["login.partner.microsoftonline.cn","login.chinacloudapi.cn"]},{"preferred_network":"login.microsoftonline.de","preferred_cache":"login.microsoftonline.de","aliases":["login.microsoftonline.de"]},{"preferred_network":"login.microsoftonline.us","preferred_cache":"login.microsoftonline.us","aliases":["login.microsoftonline.us","login.usgovcloudapi.net"]},{"preferred_network":"login-us.microsoftonline.com","preferred_cache":"login-us.microsoftonline.com","aliases":["login-us.microsoftonline.com"]}]}'
    }
});
```

## Bypass authority metadata resolution

By default, during the process of retrieving a token MSAL.js will make a network request to retrieve metadata from the authority configured for the request. If you would like to skip this network request, you can provide the required metadata in the configuration of `PublicClientApplication`.

**Important:** It is your application's responsibility to ensure it is using correct, up-to-date authority metadata. Failure to do so may result in your application not working correctly.

Instructions:

1. Determine the openid-configuration endpoint for your authority. For example, if you are using `https://login.microsoftonline.com/common/`, the openid-configuration endpoint is `https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration`.
2. Make a request to the url in step 1.
3. Take the **entire** response and provide the raw JSON string as the `auth.authorityMetadata` property for `PublicClientApplication`.

Example:

```js
const msalInstance = new msal.PublicClientApplication({
    auth: {
        authorityMetadata: '{"token_endpoint":"https://login.microsoftonline.com/common/oauth2/v2.0/token","token_endpoint_auth_methods_supported":["client_secret_post","private_key_jwt","client_secret_basic"],"jwks_uri":"https://login.microsoftonline.com/common/discovery/v2.0/keys","response_modes_supported":["query","fragment","form_post"],"subject_types_supported":["pairwise"],"id_token_signing_alg_values_supported":["RS256"],"response_types_supported":["code","id_token","code id_token","id_token token"],"scopes_supported":["openid","profile","email","offline_access"],"issuer":"https://login.microsoftonline.com/{tenantid}/v2.0","request_uri_parameter_supported":false,"userinfo_endpoint":"https://graph.microsoft.com/oidc/userinfo","authorization_endpoint":"https://login.microsoftonline.com/common/oauth2/v2.0/authorize","http_logout_supported":true,"frontchannel_logout_supported":true,"end_session_endpoint":"https://login.microsoftonline.com/common/oauth2/v2.0/logout","claims_supported":["sub","iss","cloud_instance_name","cloud_instance_host_name","cloud_graph_host_name","msgraph_host","aud","exp","iat","auth_time","acr","nonce","preferred_username","name","tid","ver","at_hash","c_hash","email"],"tenant_region_scope":null,"cloud_instance_name":"microsoftonline.com","cloud_graph_host_name":"graph.windows.net","msgraph_host":"graph.microsoft.com","rbac_url":"https://pas.windows.net"}'
    }
});
```

## Measuring performance

Applications that want to measure the performance of authentication flows in MSAL.js can do so manually, or consume the performance measures taken by the library itself.

### addPerformanceCallback

Since version `@azure/msal-browser@2.23.0`, applications can register a callback to receive performance measurements taken by the library. These measurement will include end-to-end measurements for top-level APIs, as well as measurements for important internal APIs.

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
