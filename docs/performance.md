# Performance

This document will outline techniques your application can use to improve the performance of acquire tokens using MSAL.js.

## Bypass cloud instance discovery resolution

By default, during the process of retrieving a token, MSAL.js will make a network request to retrieve metadata associated with the various Azure clouds. If you would like to skip this network request, you can provide the required metadata in the configuration of `PublicClientApplication`.

**Important:** It is your application's responsibility to ensure it is using correct, up-to-date cloud instance metadata. Failure to do so may result in your application not working correctly.

**Note:** If you are using B2C or ADFS authorities this document is not applicable. You will need to provide your authority domains to the `auth.knownAuthorities` property instead.

Instructions (AAD Scenarios):

1. Instance Discovery Endpoint: `https://login.microsoftonline.com/common/discovery/instance?api-version=1.1&authorization_endpoint=https://login.microsoftonline.com/common/oauth2/v2.0/authorize`
2. Make a request to the instance discovery endpoint
3. Provide the **entire** JSON response to the `auth.instanceMetadata` property.

The example shown below shows 5 such JSON objects in the array. If none of the aliases listed match your authority you do not need to include the corresponding object in the array. 

Example:

```js
const msalInstance = new msal.PublicClientApplication({
    auth: {
        instanceMetadata: '{"tenant_discovery_endpoint":"https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration","api-version":"1.1","metadata":[{"preferred_network":"login.microsoftonline.com","preferred_cache":"login.windows.net","aliases":["login.microsoftonline.com","login.windows.net","login.microsoft.com","sts.windows.net"]},{"preferred_network":"login.partner.microsoftonline.cn","preferred_cache":"login.partner.microsoftonline.cn","aliases":["login.partner.microsoftonline.cn","login.chinacloudapi.cn"]},{"preferred_network":"login.microsoftonline.de","preferred_cache":"login.microsoftonline.de","aliases":["login.microsoftonline.de"]},{"preferred_network":"login.microsoftonline.us","preferred_cache":"login.microsoftonline.us","aliases":["login.microsoftonline.us","login.usgovcloudapi.net"]},{"preferred_network":"login-us.microsoftonline.com","preferred_cache":"login-us.microsoftonline.com","aliases":["login-us.microsoftonline.com"]}]}'
    }
});
```
