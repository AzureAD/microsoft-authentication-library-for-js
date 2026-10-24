---
generated-by: Forge/Coder
status: prototype
---

# Native POC Bridge and NAA Bindings

This sample owns the native POC's `src`, `test`, `adapters`, local packaging and generated `artifacts`. The portable TypeScript transport lives at [msal-bridge](../../../../lib/msal-bridge/README.md). It carries opaque strings; the native host owns NAA initialization, request policy, token/error mapping, deadlines and executor lifecycle. These native projects are sample-owned prototypes, not a published or production-supported SDK.

**Required authentication boundary:** the native sample's broker mode uses the scenario-only OneAuth adapter; MSAL.NET/WAM is a separate optional comparison. See the [Windows runbook](../README.md) for current evidence, prerequisites and remaining gates.

## Components

| Component | Responsibility |
| --- | --- |
| [TypeScript package](../../../../lib/msal-bridge/README.md) | Typed transport, explicit installation, auto-install entry and browser IIFE; declarations and API Extractor reports |
| [Source exports](../../../../lib/msal-bridge/src/index.ts) | Six modules: `types`, `bridge`, `transports`, `install`, `index`, `autoInstall`; no request engine |
| [Identity.NativeBridge](src/Identity.NativeBridge/Identity.NativeBridge.csproj) | Single compiled browser bundle embedded and packed under `bridge/`; native NAA dispatch, policy and executor contracts |
| [WebView2 binding](src/Identity.NativeBridge.WebView2/WebView2Bridge.cs) | Exact trusted top-document injection, NAA transport, navigation restrictions and disposal |
| [Windows sample](../README.md) | UI, configuration, fixed child bindings, readiness, Graph call and host-owned executors |
| [Browser HostProjection](../../WebNativeBridgeTokenSample/web/host-projection.mjs) | Sample-owned browser protocol, frame/source/origin/session policy and host MSAL PCA; not a package protocol fallback |
| [Scenario-only OneAuth adapter](adapters/oneauth-webview2-poc/README.md) | Native SDK integration, P/Invoke, serialized work, account/UI policy, cancellation and result copying; excluded from packages |
| [Package-only consumer](test/PackageConsumer/PackageConsumer.csproj) | Compiled-bundle delivery and native NAA checks without project references |

See [package boundaries](PACKAGE.md). `BridgeEvent` callbacks provide local sanitized diagnostics only; no production telemetry collection or uploader is implemented. Keep tokens, claims, account data and raw SDK errors out of logs. Any future upload requires an approved schema, destination, privacy controls, bounded delivery and distribution review.

## Package Locally

The POCs consume the local compiled `lib/msal-bridge/dist/msal-bridge.js`. JavaScript API, build and consumption instructions belong to the [transport package guide](../../../../lib/msal-bridge/README.md), not this native integration guide.

Run `./Pack.ps1` from this directory. It creates `Identity.NativeBridge.Prototype.0.1.0.nupkg` and `Identity.NativeBridge.WebView2.Prototype.0.1.0.nupkg` in the ignored `artifacts` directory, then restores the package-only consumer into an isolated package cache and runs it. Nothing is uploaded to a feed.

Packaging requires the JavaScript build toolchain, but no OneAuth SDK or native adapter build. The core project builds the transport bundle. `Pack.ps1` audits exactly one loose compiled browser asset, checks it against the canonical build, rejects adapter/native SDK payloads and unexpected dependencies, and runs PackageConsumer. Core has no package dependencies; WebView2 depends only on core and Microsoft.Web.WebView2. No OneAuth headers, libraries, runtime DLLs, P/Invoke binding or CMake targets are included.

Use the generated packages only for local prototype evaluation. Package names and version are provisional, not an approved distribution or product identity.

## Host Integration

Reference `Identity.NativeBridge.WebView2.Prototype` version `0.1.0` from your .NET 8 Windows app; its core dependency is restored transitively. Initialize WebView2, configure your HTTPS local content mapping, and attach the binding before navigating:

```csharp
using Identity.NativeBridge;
using Identity.NativeBridge.WebView2;

var boundary = new NativeExecutorBoundary(clientId, authority, allowedScopes,
    executor, log, trustedDocumentUrl);
var bridge = await WebView2Bridge.AttachAsync(coreWebView2, boundary, log);
coreWebView2.Navigate(boundary.TrustedDocumentUrl);
```

`executor` is a host-owned implementation of [IBridgeTokenExecutor](src/Identity.NativeBridge/IBridgeTokenExecutor.cs):

```csharp
public interface IBridgeTokenExecutor
{
    Task<NativeToken> ExecuteAsync(NativeRequest request, CancellationToken cancellation);
}
```

The host result requires only five fields, with optional granted scopes:

```csharp
public record NativeToken(string AccessToken, string IdToken, int ExpiresIn,
    string HomeAccountId, string Environment, string? Scope = null);
```

MSAL.js derives local account ID, tenant ID, and username from the ID-token claims. Preserve the runtime's home account ID for subsequent account selection; do not substitute a tenant-local identifier. Return actual granted scopes when available or different from the request; when `Scope` is null or empty, MSAL.js falls back to requested scopes. Token source is not part of the result contract; runtime-specific diagnostics stay with the host.

[NativeExecutorBoundary](src/Identity.NativeBridge/NativeExecutorBoundary.cs) directly accepts `NestedAppAuthRequest` for `GetInitContext`, `GetToken` and `GetTokenPopup`, returning correlated `NestedAppAuthResponse` envelopes. Native code supplies initialization SDK identity/capabilities, validates actual document source, size, GUID IDs, configured client/authority, scopes and bearer/resource/attribute-token policy, and derives interaction permission from the method. It rejects missing tokens, nonpositive lifetime (`expired_native_token`) and missing account metadata. It does not independently verify JWT signatures or child audience.

Native token execution has a cooperative 110-second deadline (`TRANSIENT_ERROR / native_timeout`); caller cancellation remains `USER_CANCEL`. Native code bounds active token work to eight and retains 1,024 completed IDs; initialization remains available under token saturation. Use fresh IDs. Cleanup depends on native deadline, binding lifetime and a cooperative executor. Native code sanitizes statuses/codes; the JavaScript transport neither maps errors nor cancels requests.

Deploy the native binding and matching compiled transport together. OneAuth managed/native ABI matching is a separate deployment requirement.

The application owns authentication runtime selection, initialization, account selection, UI, and runtime disposal. Its executor must honor cancellation and return genuine access/ID tokens, positive remaining lifetime in seconds, home account ID, and account environment. It must not interact when `request.Interactive` is false. Use `ExecutorException` for sanitized protocol errors; do not include tokens or personal data in error codes. The existing delegate constructor remains available for callback-based consumers.

The sample registers a separate `NativeBrokerExecutor` per trusted child and resolves the shared OneAuth adapter after initialization. Child identity and redirect configuration remain host-controlled, not supplied by the web request. The sample's [WamExecutor](../native/WamExecutor.cs) implements the same interface as an optional transport comparison only. The core/WebView2 packages have no MSAL.NET or OneAuth dependency. Broker mode delegates to the isolated direct-native adapter without WAM substitution.

Hosts need not use C#. Another native-language binding must implement NAA processing and independent trust policy. Browser HostProjection owns its browser protocol, frame/session policy and web executor without the .NET boundary; none is supplied by the transport package.

In the sample, **Initialize native OneAuth** starts the runtime with existing `oneauthsettings.json`. Pass `-p:OneAuthAdapterRuntimeDirectory=C:\absolute\adapter-runtime` to the sample build/run command to copy architecture-matched `*.dll` files from that directory. This property neither obtains nor builds the SDK. See the [adapter runbook](adapters/oneauth-webview2-poc/README.md) for its build and lifecycle requirements.

Keep the binding alive for the WebView's lifetime. Call `bridge.Dispose()` on the WebView2 UI thread before destroying the WebView. Attachment, navigation, and disposal must occur on that thread. Do not attach multiple bindings to the same WebView or attach after navigating. The binding disables host objects, rejects additional navigation/new windows, and denies browser permissions; choose a dedicated WebView rather than one requiring unrestricted browsing. Those restrictions are not restored on disposal.

The web app configures the existing MSAL.js NAA factory with matching client ID/authority/scopes. `BridgeScript.Create(trustedDocumentUrl)` embeds the single auto-install IIFE before document scripts, guarded by `window.top === window` and exact HTTPS `location.href`. The old two-argument overload remains: it validates the document URL and ignores configuration, rather than injecting it. Consumers do not install a second bridge. Non-NAA messages remain available to host handlers. See [sample wiring](../native/Program.cs).

## Validation And Limits

The optional OneAuth mode requires an externally obtained compatible SDK and authorized host/child registrations. No private runtime records or SDK binaries are supplied; synthetic checks are not live authentication evidence.

Current validation entry points are [transport tests](../../../../lib/msal-bridge/test/transports.test.cjs), [native NAA tests](test/NativeBridgeTests/), [WebView2 checks](test/WebView2Checks/) and [PackageConsumer](test/PackageConsumer/). Run the JavaScript build/type/API/consumer checks described in its guide and `./Pack.ps1` for packaging. Sample fixtures and startup `--smoke` are not live authentication or fresh platform acceptance.

Run adapter mapping checks from this directory with `dotnet run --project adapters/oneauth-webview2-poc/test/AdapterChecks.csproj`. The SDK is statically linked privately by the adapter, not either bridge package. POC acceptance targets x64; native ARM64 support is outside scope. See the sample's [Steps To Run and POC Requirements](../README.md#steps-to-run) for verified toolchain prerequisites and the reproducible build/deployment sequence.

These POC results do not establish production security, OneAuth support, service-side child restrictions, arbitrary-frame support, other native languages, or other WebView engines. Broker mode binds a distinct host and app1/app2; only the optional WAM comparison shares a single client registration. See [debugging and limits](../README.md#debugging-and-limits).