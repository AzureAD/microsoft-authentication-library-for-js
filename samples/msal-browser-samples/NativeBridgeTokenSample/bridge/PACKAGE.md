---
generated-by: Forge/Coder
status: prototype
---

# Native Bridge Prototype

This document is embedded as the README in both local prototype NuGet packages. They deliver native NAA bindings and the compiled portable string transport:

| Local artifact | Contents |
| --- | --- |
| `Identity.NativeBridge.Prototype` | Single compiled browser bundle embedded and packed as `bridge/msal-bridge.js`; native NAA processing, executor records/interface and `NativeExecutorBoundary` |
| `Identity.NativeBridge.WebView2.Prototype` | CoreWebView2 guarded injection, NAA message routing and binding lifecycle; depends on core and Microsoft.Web.WebView2 |

The host supplies its trusted HTTPS document URL, client ID, authority, scopes, executor and diagnostic callback. Native code owns NAA initialization, request policy, token/error mapping and deadlines; the TypeScript package carries opaque strings. Executors own SDK acquisition, account/UI/threading and cooperative cleanup. Attach and dispose the WebView2 binding on its UI thread, before navigation and before destroying the WebView respectively. Use a dedicated WebView with only trusted content.

OneAuth, the scenario-specific adapter, its P/Invoke binding, SDK headers/libraries/runtime binaries, and sample configuration are excluded. Deploy matching native bindings and browser transport; match the adapter ABI and process architecture separately.

See [host integration](README.md#host-integration) and [local packaging](README.md#package-locally). [Pack.ps1](Pack.ps1) audits the payload and dependencies and runs an isolated [PackageConsumer](test/PackageConsumer/). JavaScript API and build instructions live in the [transport package guide](../../../../lib/msal-bridge/README.md).

This is an unpublished native prototype, not an approved shipping SDK. Security review, signing, supported OneAuth distribution, service-side child authorization and platform acceptance remain unverified. No secrets or sample configuration are packaged. See the [Windows runbook](../README.md) for setup and remaining gates.