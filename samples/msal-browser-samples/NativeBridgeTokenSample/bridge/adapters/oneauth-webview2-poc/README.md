---
generated-by: Forge/Coder
---

# OneAuth WebView2 POC Adapter

Scenario-only integration source for the optional Windows sample broker mode. This is not a reusable OneAuth SDK, supported binding, or approved shipping package. Core native bridge projects do not reference or pack the adapter. MSAL.NET/WAM is a separate comparison, never a broker-mode fallback.

No OneAuth SDK implementation, headers, libraries, runtime binaries or access entitlement are redistributed. Building the real adapter requires a separately obtained, appropriately licensed compatible SDK and authorization for the intended service scenario. These instructions do not grant SDK or service access. The default WAM sample, web sample and SDK-free managed checks do not require that dependency.

## Build And Deploy

Requirements: Windows, CMake 3.25+, a compatible C++20 MSVC toolchain, matching Spectre-mitigated libraries and ATL headers/libraries, Windows SDK, NuGet CLI, WebView2 Runtime, and the external native SDK. Keep process, adapter and SDK architectures matched; x64 is the prototype target.

From this directory, with your authorized SDK supplied externally:

```powershell
cmake -S . -B build/x64 -A x64 -DONEAUTH_SOURCE_DIR=C:/sdk/oneauth
cmake --build build/x64 --config Release --target OneAuthWebView2Poc
```

Alternatively supply an installed `OneAuth::OneAuth` CMake package through `CMAKE_PREFIX_PATH`. The managed MSAL.NET package and an unrelated interop DLL are not substitutes. Use a fresh build directory. SDK linkage, required runtime dependencies and redistribution terms must be reviewed for your distribution; do not assume this prototype grants approval.

Copy the real adapter and only its required runtime dependencies to a separate directory. From the Windows sample directory:

```powershell
./Run.ps1 -Broker -Runtime win-x64 -OneAuthAdapterRuntimeDirectory C:\sdk\adapter-runtime
```

Configure your own ignored settings first, then select **Initialize native OneAuth**. The private sample ABI is `poc_start_v2`; deploy the native adapter and managed binding together. Do not mix ABI versions or deploy fixture binaries. See [Windows setup](../../../README.md#steps-to-run).

## Ownership And Lifecycle

The sample owns fixed host/child identities, authority, scopes, redirects, account matching and interactive permission. The adapter owns one runtime and UX context, serialized work, cancellation/drain ordering, sanitized status mapping and immediate callback-result copying. Child requests use the runtime's home-account ID, not its internal account identifier. This is not service-side child authorization.

Startup uses the AAD configuration for this scenario. Child calls retain explicit scope semantics and nested client/redirect parameters. `NativeOneAuth.cs` exposes initialization and acquisition observations without changing calls. Inspection can contain raw access/ID tokens and must remain local and ephemeral. SDK messages, account data and tokens must never enter diagnostics.

Optional `testSlice` is host-owned, empty by default, and only for explicitly authorized test environments. It forwards `dc` and enables SDK test mode. Forwarding a parameter does not establish the actual silent/token endpoint destination. Children cannot override it.

## Checks

Managed mapping checks require no real SDK:

```powershell
dotnet run --project test/AdapterChecks.csproj -c Release
```

An SDK-free native fixture can exercise ABI/lifetime behavior:

```powershell
cmake -S . -B build/fixture -A x64 -DONEAUTH_POC_FIXTURE_ONLY=ON
cmake --build build/fixture --config Release
dotnet run --project test/AdapterChecks.csproj -c Release -r win-x64 -p:OneAuthAdapterRuntimeDirectory="$PWD/build/fixture/Release" -- --native-fixture
```

The fixture uses synthetic data and must never be deployed as a real adapter. Tests cover token copying, expiry, safe status mapping, bootstrap/retry, callbacks, cancellation and shutdown. They do not prove real authentication, SDK support, registration approval or production readiness.