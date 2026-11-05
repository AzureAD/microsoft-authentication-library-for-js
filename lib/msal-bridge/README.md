# MSAL Bridge

`@azure/msal-bridge` is an unpublished release candidate at version `0.1.0`.
It implements the exported API of PR8928 pinned to
`c5e957bc72687398963be618ca449afdf9965f86`, from
`lib/msal-nested-app-auth-bridge` in AzureAD/microsoft-authentication-library-for-js.
This is a standalone TypeScript package with no runtime dependencies. It is not
a claim of production support or registry publication.

## Build and Package

Use Node 20+ and npm. Run these commands from this directory:

```powershell
npm install --workspaces=false
npm run lint
npm run format:check
npm run build
npm run check
npm test
npm run test:coverage
npm run api:check
npm run test:consumer
npm pack
```

Build dependencies are declared locally. The parent checkout's already installed
tools can also resolve them. The package is registered in the parent npm workspace
and Beachball release scope, with major changes disallowed. Release integration
does not publish the package or change its version. `npm pack`
runs lint and formatting checks, rebuilds, and runs the type, transport, API,
and installed-package consumer checks before producing
`azure-msal-bridge-0.1.0.tgz`. Install that tarball in the consuming
project. Build the local directory before installing it directly.

| Entry                        | Artifact               | Installation             |
| ---------------------------- | ---------------------- | ------------------------ |
| Package root, ESM            | `dist/index.mjs`       | Explicit                 |
| Package root, CJS            | `dist/index.cjs`       | Explicit                 |
| `@azure/msal-bridge/auto`    | `dist/autoInstall.mjs` | Automatic                |
| `@azure/msal-bridge/browser` | `dist/msal-bridge.js`  | Automatic classic script |

**Native embedding path:** `msal-bridge/dist/msal-bridge.js`.
Inject this single compiled IIFE into the trusted document before MSAL initializes.
It exposes the global `NestedAppAuthBridge` and installs `window.nestedAppAuthBridge`.
There are no separate protocol or facade source scripts to inject.

All JavaScript outputs have source maps. ESM declarations and declaration maps are
under `types/`; `types/index.d.cts` is a standalone CommonJS declaration bundle.
The tarball includes TypeScript sources so its map references remain usable.
The auto and browser artifacts are explicitly listed as side effects.

## Explicit Installation

ESM root imports do not inspect `window` or install globals until called:

```typescript
import { installNestedAppAuthBridge } from "@azure/msal-bridge";

const bridge = installNestedAppAuthBridge();
```

CommonJS exposes the same runtime exports:

```javascript
const { installNestedAppAuthBridge } = require("@azure/msal-bridge");
const bridge = installNestedAppAuthBridge();
```

Auto installation requires a supported host already available on `window`:

```typescript
import { nestedAppAuthBridge } from "@azure/msal-bridge/auto";
```

The equivalent classic script is the compiled browser artifact. Unsupported hosts
throw; auto installation does not silently fall back to a browser protocol.

## API and Transport Contract

The [root API report](apiReview/msal-bridge.api.md) records every pinned
signature. The [auto API report](apiReview/msal-bridge-auto.api.md) adds
only `nestedAppAuthBridge`. [Source exports](src/index.ts) are authoritative.

Runtime root exports are `DefaultNestedAppAuthBridge`, `installNestedAppAuthBridge`,
`createNestedAppAuthTransport`, `WebView2Transport`, `WKWebViewTransport`, and
`NESTED_APP_AUTH_HANDLER_NAME` (the string `nestedAppAuth`).

Exported types are `NestedAppAuthBridge`, `NestedAppAuthBridgeOptions`,
`NestedAppAuthHost`, `NestedAppAuthMessageEvent`, `NestedAppAuthMessageListener`,
`NestedAppAuthTransport`, `NestedAppAuthWindow`, `WebView2Host`,
`WebView2MessageEvent`, and `WKWebViewMessageHandler`.

`installNestedAppAuthBridge(options = {})` accepts exactly:

| Option                                       | Default / behavior                                            |
| -------------------------------------------- | ------------------------------------------------------------- |
| `window?: Window`                            | Current `window`                                              |
| `host?: "auto" \| "wkwebview" \| "webview2"` | `auto`; detects WKWebView before WebView2                     |
| `handlerName?: string`                       | `nestedAppAuth`, for WKWebView                                |
| `maxMessageLength?: number`                  | 1,048,576 JavaScript string characters; positive safe integer |
| `replaceExisting?: boolean`                  | False; reuses an existing active global                       |
| `transport?: NestedAppAuthTransport`         | Injected transport takes precedence over host detection       |

WKWebView posts to `window.webkit.messageHandlers[handlerName].postMessage(string)`;
native responses call `window.nestedAppAuthBridge.__dispatch(message)`.
WebView2 posts to `window.chrome.webview.postMessage(string)` and receives the host's
`message` events. Both surface bridge events as `{ data: string }`.

Custom transports implement the pinned interface, not the old event-listener transport:

```typescript
import { DefaultNestedAppAuthBridge } from "@azure/msal-bridge";
import type { NestedAppAuthTransport } from "@azure/msal-bridge";

declare const transport: NestedAppAuthTransport;
const bridge = new DefaultNestedAppAuthBridge(transport);
```

The interface has `readonly host: "wkwebview" | "webview2"`,
`postMessage(message: string): void`, `start(onMessage: (message: unknown) => void): void`,
and `dispose(): void`. `start` connects incoming delivery; the bridge owns its
transport's lifetime. A reused transport must support `start` after `dispose`.

## Wire and Lifecycle

Outgoing strings pass through unchanged, including opaque non-JSON strings.
Incoming strings are unchanged; other values use `JSON.stringify`. Undefined or
otherwise nonserializable results throw. Both directions enforce the length limit.
This package does not parse NAA, generate init responses, interpret methods, map
tokens/errors, track requests, or implement timers, cancellation, replay registries,
or concurrency limits. The native host owns NAA processing and security policy.

The bridge supports `postMessage`, `addEventListener("message", callback)`,
`removeEventListener("message", callback)`, `__dispatch`, and `dispose`.
Listeners are deduplicated and delivered from a snapshot. A throwing listener does
not block later subscribers. Each listener receives a fresh event object, so
mutating its `data` does not affect later listeners. Disposal during dispatch
does not interrupt the current snapshot, but prevents subsequent dispatches.
Exceptions are contained without logging payloads.

Disposal is idempotent, clears subscribers, and detaches the WebView2 listener. It
does not delete or rewrite the global. Posting, subscribing, or dispatching after
disposal throws. Reinstalling a locally disposed bridge creates a fresh bridge;
unknown third-party globals retain the pinned reuse semantics.

Replacement resolves the transport and validates the message limit before disposing
the old bridge, then starts the replacement. Unsupported hosts and invalid limits
leave the previous bridge active. If transport startup fails, the error propagates
and the previous bridge remains disposed; there is no rollback. Injected transports
are responsible for exception-safe startup and cleanup.

There are no old `installNativeBridge`, `createProtocol`, `validateNativeRequest`,
`MsalBridge`, or `MsalBridgeFacade` compatibility exports. Consumers of those APIs
must migrate; no protocol translation is provided.

## Validation

[Transport tests](test/transports.test.cjs) use Node's test runner and compiled CJS
with fake windows. [Packed-consumer checks](scripts/consumer.cjs) install an actual
tarball and exercise ESM, CJS, auto installation, NodeNext declarations, both browser
host surfaces, payload contents, and source maps. `api:check` fails on report drift;
`api:update` regenerates reports only after deliberate API review.

The consumer also bundles side-effect-only root and `/auto` imports using Rollup
and its standard node resolver against the installed package. The root import is
removed; `/auto` is retained according to the package's `sideEffects` metadata,
and the resulting bundle is executed against both fake host surfaces.
The fixture packs with `--ignore-scripts` to avoid recursively invoking `prepack`;
generated consumers stay under `temp/` and are excluded from the tarball.

`npm run prepack` is the complete validation gate, including the consumer checks.
`npm run format:fix` formats authored source, tests, scripts, configuration, and
this README without rewriting API reports. `npm run test:coverage` reports Node's
experimental coverage for the compiled artifacts exercised by the transport tests;
it does not impose a coverage threshold or include the separate consumer process.

These checks do not perform live authentication or validate WKWebView on macOS.
Native host integration, authentication policy, and native packaging are outside
the scope of this JavaScript package.
