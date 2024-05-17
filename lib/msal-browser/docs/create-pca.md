# Creating Client Application instances for MSAL JS

## Standard Configuration

If you are using MSAL.js in a single-page application, you should import msal-browser to create an [IPublicClientApplication](.\lib\msal-browser\src\app\IPublicClientApplication.ts) instance with `createStandardPublicClientApplication`. This function will create a PublicClientApplication instance with the standard configuration.

```javascript
import * as msal from "@azure/msal-browser";

const pca = msal.createStandardPublicClientApplication({
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_ID",
    },
});
```

## Nested App Configuration

If your app is an iframed Nested app and delegating its authentication to a hub SDK (which is either a SPA or a desktop application running in MetaOS framework), you should import msal-browser to create a IPublicClientApplication instance with `createNestablePublicClientApplication`. This function will create a PublicClientApplication instance with the NAA configuration.

```javascript
import * as msal from "@azure/msal-browser";

const nestablePca = msal.createNestablePublicClientApplication({
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_ID",
        supportsNestedAppAuth: true,
    },
});
```

Please note that `createNestablePublicClientApplication` will fall back to `createStandardPublicClientApplication` if nested app bridge is unavailable or `supportsNestedAppAuth` is set to false.
