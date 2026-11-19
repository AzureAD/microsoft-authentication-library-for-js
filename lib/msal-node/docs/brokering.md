# Acquiring Device Bound Tokens

MSAL Node supports acquiring tokens from the native token broker. When using the native broker refresh tokens are bound to the device on which they are acquired on and are not accessible by `msal-node` or the application. This provides a higher level of security that cannot be achieved by `msal-node` alone.

## Supported Environment

MSAL Node supports native brokering on Windows, Linux, and macOS with a compatible `@azure/msal-node-extensions` and native runtime. Use Node.js 20 or later. Installation, redirect URIs, and capabilities vary by platform:

| Platform | Setup | Access-token PoP |
| --- | --- | --- |
| Windows | Register `ms-appx-web://Microsoft.AAD.BrokerPlugin/<your-client-id>` as described below. | Supported |
| Linux | [Linux broker installation, dependencies, and registration](#linux). | Not supported |
| macOS | [Company Portal, SSO plug-in, and registration](#macos). | Supported |

## Pre-requisites

-   Install `@azure/msal-node-extensions` as a dependency
-   On Windows, register the broker's redirectUri under **Mobile and desktop applications**: `ms-appx-web://Microsoft.AAD.BrokerPlugin/<your-client-id>`, replacing `<your-client-id>` with your clientId. Linux and macOS use the different URIs linked above.

### Linux

Microsoft Single Sign-on for Linux is an independently installed broker that integrates with accounts known to the system. Broker updates can deliver security fixes independently of application updates.

- Use a supported **x64** distribution: Ubuntu 22.04/24.04 or Red Hat Enterprise Linux (RHEL) 8/9/10.
- Install `microsoft-identity-broker` from the Microsoft package repository configured for the distribution. After configuring that repository, use `sudo apt install microsoft-identity-broker` on Ubuntu or `sudo dnf install microsoft-identity-broker` on RHEL. It may also be installed as a dependency of Microsoft device-management software.
- Ensure a user D-Bus session, a usable system keyring, and the native dependencies below are available. A desktop sign-in session normally provides these; a headless server or container does not necessarily do so.
- Register this redirect URI under **Mobile and desktop applications**:

```text
https://login.microsoftonline.com/common/oauth2/nativeclient
```

Distribution support also depends on the installed broker/runtime version. Do not infer support for ARM64, other distributions, or a headless interactive flow from Node.js support alone.

#### Native dependencies

| Distribution | Runtime/keyring/IPC packages | Interactive UI packages |
| --- | --- | --- |
| Ubuntu 22.04/24.04 | `libsecret-1-0 libdbus-1-3` | `libwebkit2gtk-4.1-0 libgtk-3-0` |
| RHEL 8 | `libsecret dbus-libs openssl3-libs` | `webkit2gtk3 gtk3` |
| RHEL 9 | `libsecret dbus-libs` | `webkit2gtk3 gtk3` |
| RHEL 10 | `libsecret dbus-libs` | `webkitgtk6.0 gtk4` |

Install the applicable row using the distribution's package manager. `libsecret` supplies keyring integration, D-Bus supplies broker communication, and WebKitGTK/GTK supply the sign-in UI. RHEL 8 needs OpenSSL 3 libraries because its default OpenSSL version is older.

A missing user session bus cannot be fixed by installing `dbus-libs` alone. Launch from a normal desktop user session or provision an appropriate session explicitly, for example with `dbus-run-session` when suitable. This does not create a desktop display or unlock a keyring for an unattended process.

Linux brokering does not support B2C, AD FS, third-party identity-provider authorities, or access-token proof of possession.

### macOS

The Microsoft Enterprise SSO plug-in for Apple devices, delivered with Company Portal, integrates with system accounts and protects refresh tokens in the device context.

- Use an Intel **x64** or Apple Silicon **ARM64** device. The native runtime must match the Node.js process architecture.
- Use a currently supported macOS release that meets the requirements of Node.js, Company Portal, and the installed native runtime. A historical minimum version for the SSO plug-in alone is not a support guarantee for the complete application.
- Install Company Portal, enroll the device, and configure the Enterprise SSO plug-in through device management. Verify that sign-in works through the plug-in in another Microsoft application before troubleshooting application code.
- Register the appropriate broker redirect URI under **Mobile and desktop applications**.

For deployment prerequisites, see [Enterprise SSO plug-in for Apple devices](https://learn.microsoft.com/entra/identity-platform/apple-sso-plugin) and [macOS enrollment](https://learn.microsoft.com/intune/intune-service/user-help/enroll-your-device-in-intune-macos-cp). These are deployment requirements, not something the npm package installs.

#### Redirect URI

Unsigned scripts and CLI applications use:

```text
msauth.com.msauth.unsignedapp://auth
```

Signed/bundled applications use their actual bundle identifier:

```text
msauth.<your-bundle-id>://auth
```

For example, the bundle `com.example.myapp` uses `msauth.com.example.myapp://auth`. Register that exact URI and pass it as `redirectUri` on both interactive and silent broker requests for the signed app. Omitting it selects the unsigned-app default; it does not infer a signed application's bundle ID.

Keep broker and non-broker browser redirect URIs separate. Do not give a broker custom scheme to a normal browser/loopback authentication flow.

B2C, AD FS, and third-party identity-provider authorities are not supported through the macOS broker. Access-token proof of possession is supported; see [PoP request parameters](#proof-of-possession).

## Enable the feature

Enabling token brokering requires just 1 new configuration parameter:

```typescript
import { PublicClientApplication, Configuration } from "@azure/msal-node";
import { NativeBrokerPlugin } from "@azure/msal-node-extensions";

const nativeBrokerPlugin = new NativeBrokerPlugin();
if (!nativeBrokerPlugin.isBrokerAvailable) {
    throw new Error("The native broker runtime could not initialize.");
}

const msalConfig: Configuration = {
    auth: {
        clientId: "your-client-id",
    },
    broker: {
        nativeBrokerPlugin,
    },
};

const pca = new PublicClientApplication(msalConfig);
```

### Broker availability and failures

Once a request is sent to the broker, a broker failure is returned to the caller; MSAL does not retry that operation through the browser.

Native-runtime startup is different: if the supplied plugin reports `isBrokerAvailable: false`, MSAL does not activate it and can use the non-brokered flow. If your application's security requirements mandate brokering, check `nativeBrokerPlugin.isBrokerAvailable` and fail explicitly before constructing the client, as shown above. This startup check is not a guarantee that Company Portal, the Linux broker, enrollment, or device policy is configured correctly; requests can still fail.

A working sample can be found [here](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/samples/msal-node-samples/auth-code-cli-brokered-app)

Concurrent equivalent `acquireTokenSilent` calls on the same `PublicClientApplication` instance share a single native broker plugin call. Native account IDs and proof-of-possession parameters, including `shrNonce`, are part of request equivalence. Each successful caller receives its own correlation ID in the result. A shared failure returns the original error to every caller, preserving the correlation ID and nested diagnostics of the underlying broker operation. This does not change the broker's cache policy or add fallback after a broker failure.

## Acquire tokens and manage caching

After constructing `pca` above, acquire a token interactively, then use the returned account for silent requests:

```javascript
const request = {
    scopes: ["User.Read"],
    // For a signed macOS app, set redirectUri to its registered broker URI.
};
const result = await pca.acquireTokenInteractive(request);
if (!result.account) {
    throw new Error("Broker sign-in did not return an account.");
}

const silentResult = await pca.acquireTokenSilent({
    ...request,
    account: result.account,
});
```

Without an explicit `redirectUri`, the plugin selects the platform default: the Windows broker URI, the Linux native-client URI, or the macOS unsigned-app URI. Signed macOS apps must explicitly set their registered URI on the request.

On subsequent runs, use `await pca.getAllAccounts()` to discover broker accounts and select the intended account explicitly; do not rely on array order. Handle `InteractionRequiredAuthError` from silent acquisition by offering interactive sign-in. Handle other failures separately, avoid repeated retries, and do not log token responses.

The broker manages its token cache. A file-cache plugin is not needed to persist broker-managed tokens, and MSAL's serialized cache is not an export of the broker's refresh tokens. `forceRefresh` does not force the broker to ignore its cache.

Interactive authentication can display native system UI, including WebKitGTK-based UI on Linux. Ensure users can see and interact with it.

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

Access token proof of possession is supported through the Windows and macOS brokers, but not the Linux broker. To request a PoP token you will need to add a couple additional properties to the request object provided to `acquireTokenInteractive` or `acquireTokenSilent`

### AT PoP Request Parameters

|           Name          |                      Description                            | Required |
|-------------------------| ----------------------------------------------------------- | -------- |
|  `authenticationScheme` | Indicates whether MSAL should acquire a `Bearer` or `PoP` token. Default is `Bearer`. | **Required** |
| `resourceRequestMethod` | The all-caps name of the HTTP method of the request that will use the signed token (`GET`, `POST`, `PUT`, etc.) | **Required** |
| `resourceRequestUri`    | The URL of the protected resource for which the access token is being issued | **Required** |
|      `shrNonce`         | A server-generated, signed timestamp that is Base64URL encoded as a string. This nonce is used to mitigate clock-skew and time-travel attacks meant to enable PoP token pre-generation. | *Optional* |

### Usage Example

```typescript
import { PublicClientApplication, Configuration, AuthenticationScheme } from "@azure/msal-node";
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
    authenticationScheme: AuthenticationScheme.POP,
    resourceRequestMethod: "POST",
    resourceRequestUri: "YOUR_RESOURCE_ENDPOINT",
    shrNonce: "NONCE_ACQUIRED_FROM_RESOURCE_SERVER"
}

const result = await pca.acquireTokenInteractive(popTokenRequest);
if (!result.account) {
    throw new Error("Broker sign-in did not return an account.");
}
await pca.acquireTokenSilent({ ...popTokenRequest, account: result.account });
```

## Differences when using the broker to acquire tokens

There are a few things that may behave a little differently when acquiring tokens through the native broker.

-   The `forceRefresh` parameter for `acquireTokenSilent` calls is not supported. You may receive a cached token from the broker regardless of what this flag is set to.
-   If the broker needs to prompt the user for interaction, a system prompt will be opened. This is a UX change as authentication will not occur in a browser window.
-   Access token proof-of-possession is supported by the Windows and macOS brokers, but not by the Linux broker or the non-brokered flow.
-   Broker-managed refresh tokens are not exposed through MSAL's serialized token cache. See [caching behavior](#acquire-tokens-and-manage-caching) before configuring separate cache persistence.
