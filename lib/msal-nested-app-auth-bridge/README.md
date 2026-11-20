# MSAL Nested App Auth Bridge

`@azure/msal-nested-app-auth-bridge` installs the
`window.nestedAppAuthBridge` contract used by MSAL Browser's
`createNestablePublicClientApplication` API.

The package is host-neutral and supports:

-   `window.webkit.messageHandlers.nestedAppAuth` for WKWebView.
-   `window.chrome.webview` for WebView2.

The native host remains responsible for validating the requesting frame,
authorizing its client registration, invoking the platform broker, and
returning each response to the requesting frame.

## Browser bundle

Inject `dist/nested-app-auth-bridge.js` at document start in every frame. The
bundle automatically installs the bridge:

```js
const bridge = window.nestedAppAuthBridge;
bridge.addEventListener("message", (event) => {
    console.log(event.data);
});
bridge.postMessage(JSON.stringify({ messageType: "NestedAppAuthRequest" }));
```

WKWebView hosts return messages by invoking:

```js
window.nestedAppAuthBridge.__dispatch(response);
```

WebView2 hosts return messages with `PostWebMessageAsJson` or
`PostWebMessageAsString`; the package subscribes to the WebView2 `message`
event.

## Module usage

```ts
import { installNestedAppAuthBridge } from "@azure/msal-nested-app-auth-bridge";

installNestedAppAuthBridge();
```

Applications normally use automatic transport detection. Explicit
`WKWebViewTransport` and `WebView2Transport` instances are available for host
integration tests and controlled embedding scenarios.
