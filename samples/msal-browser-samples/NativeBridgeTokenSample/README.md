---
generated-by: Forge/Coder
---

# Windows Native Bridge Token Sample

A Windows WPF/WebView2 host demonstrates the [MSAL Bridge transport](../../../lib/msal-bridge/README.md), native NAA dispatch, and host-owned authentication policy. The portable package transports opaque messages; it does not acquire tokens or authorize children. Native bindings and executors are sample-owned prototypes, not a supported SDK.

The default mode uses public MSAL.NET/WAM with one configured registration. Optional `--broker` mode uses two distinct children and the [scenario-only OneAuth adapter](bridge/adapters/oneauth-webview2-poc/README.md), with no WAM fallback. That mode requires a separately obtained, appropriately licensed native SDK and compatible service configuration. No OneAuth SDK source, headers, libraries, binaries, or access entitlement are supplied here.

## Steps To Run

Requirements: Windows 10/11, .NET 8 SDK and matching Windows Desktop Runtime, WebView2 Evergreen Runtime, Node 22+, and npm. Use x64 for the optional adapter unless you have built and validated a matching ARM64 runtime.

From this sample directory:

```powershell
./Prepare.ps1 -Runtime win-x64
if (!(Test-Path appsettings.json)) { Copy-Item appsettings.example.json appsettings.json }
```

`Prepare.ps1` defaults to this repository, installs workspace dependencies, builds msal-common before msal-browser, builds msal-bridge, stages browser assets, runs native checks, and builds the host. Use `-SkipInstall` only with existing dependencies. Replace the placeholder client ID in ignored `appsettings.json` with your own public-client registration, tenant and delegated scopes. Register the WAM redirect required by your registration and MSAL.NET configuration; do not add a client secret.

```powershell
./Run.ps1 -Runtime win-x64
```

The host opens one embedded tab and can open two more. Each has its own WebView2, trusted virtual HTTPS origin and transport, but this comparison uses one client registration and a shared MSAL.NET/WAM executor. Virtual hosts serve local content and do not require DNS changes.

## Optional Broker Mode

Start from [brokersettings.example.json](brokersettings.example.json) and [oneauthsettings.example.json](oneauthsettings.example.json). All GUIDs are placeholders, not usable registrations. Copy them to ignored local files only when absent, then configure your own host, tenant, two distinct child registrations, exact redirects, allowed scopes and host associations. The host IDs in both files must match. Keep test routing empty unless explicitly authorized for your environment.

The example child virtual origins are `https://bridge-poc.local` and `https://app2.bridge-poc.local`, with corresponding `brk-multihub` redirects. Those redirects require applicable broker/service support and authorization; a local allowlist does not grant service-side permission. This sample neither creates registrations nor enables a service feature.

Build the adapter using its [guide](bridge/adapters/oneauth-webview2-poc/README.md), then supply only the matching real runtime directory:

```powershell
./Run.ps1 -Broker -Runtime win-x64 -OneAuthAdapterRuntimeDirectory C:\sdk\adapter-runtime
```

Select **Initialize native OneAuth** before requesting a token. Each child is bound to its own client ID, redirect, origin, scope allowlist and browser profile. Authentication and Graph access require your own consented test account and configured registrations. Initialization, acquisition and Graph success are separate acceptance checks. Compilation or synthetic tests do not establish live authentication.

## Local Regression Checks

```powershell
dotnet run --project test/NativeBridgeTests.csproj -c Release
node --test test/bridge.spec.cjs test/browser.spec.cjs
```

Browser tests require Playwright and Edge; set `BRIDGE_PLAYWRIGHT` to an installed Playwright package if necessary. Checks use synthetic accounts and tokens, not live authentication. The managed suite covers NAA validation, executor result mapping, cancellation, replay and deadline handling.

The four files in `native/bridge` compile directly into the sample executable. Its project builds and embeds the portable JavaScript transport from `lib/msal-bridge`; there are no separate native library projects or NuGet packaging steps. The single managed test project compiles the same boundary source without WPF or the optional SDK.

## Debugging And Limits

Native diagnostics are written beneath `%LOCALAPPDATA%\MSALNativeBridgePOC`. Use request and correlation IDs for tracing; never log tokens, claims, personal data or raw SDK errors. There is no production telemetry uploader.

The child inspection pane displays complete NAA request/response payloads, including returned tokens. Optional broker mode also exposes managed/native invocation and result inspection. These are sensitive local displays, not HTTP captures. Do not share screenshots or traces. Clear the panes after inspection; closing the window clears in-memory state. Inspection does not persist payloads to logs or storage.

The binding trusts only its configured HTTPS top document and restricts navigation, new windows, permissions and host objects. The native boundary validates configured identities, authority, scopes, request IDs, size and supported token policy. It does not independently verify JWT signatures or child audience. Cancellation is cooperative and cannot undo service work already dispatched.

This is a prototype, not a security-reviewed or supported production integration. SDK distribution/support, service-side child authorization, live Graph/audience/routing validation and the supported native platform matrix remain separate requirements. No private registration evidence, runtime output or SDK binary is included.