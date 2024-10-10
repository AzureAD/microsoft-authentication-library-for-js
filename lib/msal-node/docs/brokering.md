# Acquiring Device Bound Tokens

MSAL Node supports acquiring tokens from the native token broker. When using the native broker refresh tokens are bound to the device on which they are acquired on and are not accessible by `msal-node` or the application. This provides a higher level of security that cannot be achieved by `msal-node` alone.

## Supported Environment

This feature is currently only supported on Windows.

## Pre-requisites

-   Install `@azure/msal-node-extensions` as a dependency
-   Register the broker's redirectUri on your app registration: `ms-appx-web://Microsoft.AAD.BrokerPlugin/<your-client-id>`, replacing `<your-client-id>` with your clientId.

## Enable the feature

Enabling token brokering requires just 1 new configuration parameter:

```javascript
import { PublicClientApplication, Configuration } from "@azure/msal-node";
import { NativeBrokerPlugin } from "@azure/msal-node-extensions";

const msalConfig: Configuration = {
    auth: {
        clientId: "your-client-id",
    },
    broker: {
        nativeBrokerPlugin: new NativeBrokerPlugin(),
    },
};

const pca = new PublicClientApplication(msalConfig);
```

Please note that `msal-node` will _not_ fallback to the non-brokered flow in the event of a failure. In order to avoid unexpected failures in the future, only enable the broker flow in environments which support it (refer to the [Supported Environment](#supported-environment) section above).

A working sample can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/auth-code-cli-brokered-app)

## Window Parenting

In order for auth prompts to display over the top of the calling application and block further interaction, you will need to provide the application's "window handle" to the `acquireTokenInteractive' API.

For CLI apps a best effort attempt to find the window handle is made under the hood, but it is unreliable.

If you're using Electron you can use the [`getNativeWindowHandle` Electron exposes](https://www.electronjs.org/docs/latest/api/browser-window#wingetnativewindowhandle) and pass the result into `acquireTokenInteractive`

```js
import { BrowserWindow } from "electron";

const win = new BrowserWindow();

const pca = new PublicClientApplication(msalConfig);

pca.acquireTokenInteractive({
    windowHandle: win.getNativeWindowHandle(),
});
```

## Proof of Possession

Access token proof of possession is supported when acquiring tokens through the native broker. To request a PoP token you will need to add a couple additional properties to the request object provided to `acquireTokenInteractive` or `acquireTokenSilent`

### AT PoP Request Parameters

|           Name          |                      Description                            | Required |
|-------------------------| ----------------------------------------------------------- | -------- |
|  `authenticationScheme` | Indicates whether MSAL should acquire a `Bearer` or `PoP` token. Default is `Bearer`. | **Required** |
| `resourceRequestMethod` | The all-caps name of the HTTP method of the request that will use the signed token (`GET`, `POST`, `PUT`, etc.) | **Required** |
| `resourceRequestUri`    | The URL of the protected resource for which the access token is being issued | **Required** |
|      `shrNonce`         | A server-generated, signed timestamp that is Base64URL encoded as a string. This nonce is used to mitigate clock-skew and time-travel attacks meant to enable PoP token pre-generation. | *Optional* |

### Usage Example

```javascript
import { PublicClientApplication, Configuration } from "@azure/msal-node";
import { NativeBrokerPlugin } from "@azure/msal-node-extensions";

const msalConfig: Configuration = {
    auth: {
        clientId: "your-client-id",
    },
    broker: {
        nativeBrokerPlugin: new NativeBrokerPlugin(),
    },
};

const pca = new PublicClientApplication(msalConfig);

const popTokenRequest = {
    scopes: ["User.Read"],
    authenticationScheme: msal.AuthenticationScheme.POP,
    resourceRequestMethod: "POST",
    resourceRequestUri: "YOUR_RESOURCE_ENDPOINT",
    shrNonce: "NONCE_ACQUIRED_FROM_RESOURCE_SERVER"
}

pca.acquireTokenInteractive(popTokenRequest);
pca.acquireTokenSilent(popTokenRequest);
```

## Differences when using the broker to acquire tokens

There are a few things that may behave a little differently when acquiring tokens through the native broker.

-   The `forceRefresh` parameter for `acquireTokenSilent` calls is not supported. You may receive a cached token from the broker regardless of what this flag is set to.
-   If the broker needs to prompt the user for interaction, a system prompt will be opened. This is a UX change as authentication will not occur in a browser window.
-   Access token proof-of-possession _is_ supported by the broker but _is not_ supported by the non-brokered flow
