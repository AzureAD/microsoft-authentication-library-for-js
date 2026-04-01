# @azure/msal-node-mtls-extensions

Managed Identity mTLS Proof-of-Possession (mTLS PoP) token acquisition for `@azure/msal-node`.

## Overview

This package provides `acquireMtlsMsiToken` — a function that acquires an mTLS PoP access token
from the Azure Managed Identity endpoint on a Windows VM.

The Managed Identity mTLS PoP flow requires creating a **KeyGuard RSA key** — a hardware-backed
non-exportable private key backed by Windows Virtualization-Based Security (VBS). Because this key
physically cannot be exported or transferred between processes, the entire flow (key creation, CSR
generation, IMDS credential issuance, and the mTLS token request) runs in a .NET subprocess
(`MsalMtlsMsiHelper.exe`) bundled with this package.

Node.js handles everything else: the initial IMDS `/getplatformmetadata` call, spawning the
subprocess, parsing the token response, and returning a standard `AuthenticationResult`.

## Requirements

- **Windows only** — the KeyGuard key requires Windows VBS
- `x64` architecture (`arm64` is not yet supported — see [Requirements](#requirements-full-list))
- Azure VM with a Managed Identity configured
- **.NET 8 runtime** installed on the VM (check with `dotnet --version`; pre-installed on most Azure VM images)
- **VBS (Virtualization-Based Security)** enabled on the VM for KeyGuard key creation
- For `withAttestation: true`: some VM configurations require VBS attestation (see [Attestation](#attestation) below)

## Installation

```bash
npm install @azure/msal-node-mtls-extensions
```

## Usage

### System-Assigned Managed Identity

```typescript
import { acquireMtlsMsiToken } from "@azure/msal-node-mtls-extensions";

const result = await acquireMtlsMsiToken({
    resource: "https://graph.microsoft.com/",
});

console.log(result.accessToken);    // mTLS PoP access token
console.log(result.tokenType);      // "mtls_pop"
console.log(result.bindingCertificate); // PEM cert bound to the token
```

> **Supported resources:** Not all Azure resources accept `mtls_pop` tokens.
> `https://graph.microsoft.com/` and `https://vault.azure.net/` are confirmed to work.
> `management.azure.com` returns `AADSTS392196` in many subscriptions.

### User-Assigned Managed Identity

```typescript
const result = await acquireMtlsMsiToken({
    resource: "https://graph.microsoft.com/",
    identityType: "UserAssigned",
    identityId: "your-client-id-or-resource-id",
});
```

### With KeyGuard Attestation (VBS attestation via MAA)

```typescript
const result = await acquireMtlsMsiToken({
    resource: "https://graph.microsoft.com/",
    withAttestation: true, // includes MAA JWT proving key is hardware-backed
});
```

Some VMs (particularly newer VM SKUs or regions where the IMDS `issuecredential`
endpoint requires it) return the error `"Attestation Token is missing / empty in the
issue credential request"` unless `withAttestation: true` is passed. This option
requires `AttestationClientLib.dll` to be present alongside `MsalMtlsMsiHelper.exe`
in the `bin/win-x64/` directory — it is included automatically when you run
`npm run build:binaries` or install the published npm package.

## API

### `acquireMtlsMsiToken(request: MtlsMsiTokenRequest): Promise<AuthenticationResult>`

Acquires an mTLS PoP access token for a Managed Identity.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `resource` | `string` | required | Azure resource URI |
| `identityType` | `"SystemAssigned" \| "UserAssigned"` | `"SystemAssigned"` | Identity type |
| `identityId` | `string` | — | Client/resource ID for UserAssigned |
| `withAttestation` | `boolean` | `false` | Include MAA attestation (required on some VMs) |
| `correlationId` | `string` | — | Optional GUID for telemetry |
| `forceRefresh` | `boolean` | `false` | Bypass in-memory token cache |

### `getPlatformMetadata(): Promise<PlatformMetadata>`

Calls the IMDS `/metadata/identity/getplatformmetadata` endpoint. Use this to inspect the
VM's managed identity metadata independently.

## How it works

```
Node.js
  ├─[1] spawn MsalMtlsMsiHelper.exe
  │       ├─ GET /metadata/identity/getplatformmetadata  (IMDS, plain HTTP)
  │       ├─ Get/create KeyGuard RSA key (Windows CNG / VBS)
  │       ├─ Generate CSR (embedded clientId/tenantId/cuId)
  │       ├─ [optional] MAA attestation via AttestationClientLib.dll
  │       ├─ POST /metadata/identity/issuecredential → X.509 binding cert
  │       └─ POST {mtlsEndpoint}/{tenantId}/oauth2/v2.0/token (mTLS)
  │             → { access_token, token_type, expires_in, tenant_id, client_id }
  └─[2] Return AuthenticationResult
```

## Requirements (full list)

| Requirement | Notes |
|---|---|
| **Windows only** | KeyGuard RSA keys require Windows VBS |
| `x64` | Only x64 is supported. arm64 is not yet validated (`AttestationClientLib.dll` does not ship for arm64 in the current NuGet package). |
| **Azure VM with Managed Identity** | System-assigned or user-assigned |
| **.NET 8 runtime** | `MsalMtlsMsiHelper.exe` is a framework-dependent binary. .NET 8 is pre-installed on most Azure VM images. Check with `dotnet --version`. |

> If .NET 8 is not available on your VM, it can be installed via the [Azure VM .NET extension](https://learn.microsoft.com/en-us/dotnet/core/install/linux-scripted-manual).

## Attestation

Some Azure VM configurations require VBS attestation to be included in the
`issuecredential` request to IMDS. This is indicated when the call fails with:

```
"Attestation Token is missing / empty in the issue credential request"
```

Pass `withAttestation: true` to resolve this. When attestation is enabled, the
subprocess calls `AttestationClientLib.dll` (a native component from the
`Microsoft.Azure.Security.KeyGuardAttestation` NuGet package) to obtain a
hardware-backed attestation JWT from the VM's regional MAA endpoint, then
includes that JWT in the `issuecredential` call.

`AttestationClientLib.dll` is included automatically in `bin/win-x64/` when you
run `npm run build:binaries`. It is **not committed to git** (like the `.exe`).

> **Note:** VBS attestation requires a VM with Virtualization-Based Security enabled.
> Standard Azure VM SKUs support KeyGuard key creation. Attestation requires a
> VBS-capable SKU.

## The `MsalMtlsMsiHelper.exe` binary

`MsalMtlsMsiHelper.exe` is a **framework-dependent** .NET 8 application published to
`bin/win-{arch}/MsalMtlsMsiHelper.exe` at build time. For `x64`, `AttestationClientLib.dll`
(from `Microsoft.Azure.Security.KeyGuardAttestation`) is also copied to the same directory.
Neither file is committed to git.

It wraps [`Microsoft.Identity.Client`](https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-net-migration)
with [`Microsoft.Identity.Client.KeyAttestation`](https://www.nuget.org/packages/Microsoft.Identity.Client.KeyAttestation),
which provides hardware-backed KeyGuard key management and MAA attestation support.

### Building the binary

The binary is built automatically when you run `npm run build:binaries` or `npm pack`/`npm publish` (via `prepack`).

**Requirements:** .NET 8 SDK and `windows-latest` GitHub Actions runner (or any Windows machine with .NET 8 SDK).

```bash
# Build TypeScript + .NET helper for both win-x64 and win-arm64
npm run build:binaries
```

This calls `dotnet publish -r win-{arch} --self-contained false /p:PublishSingleFile=true` for each architecture.

### CI / release

The `.github/workflows/msal-node-mtls-extensions.yml` workflow:
- Triggers on push/PR to `dev` touching this package
- Builds the .NET helper for both architectures
- Runs all TypeScript tests
- Uploads `MsalMtlsMsiHelper.exe` as a GitHub Actions artifact

For npm publish, the release CI must run `npm run build:binaries` on a `windows-latest` runner before `npm publish`. The `prepack` script enforces this — publishing will fail if the binaries are absent.

## Why a subprocess instead of a native Node.js addon?

The KeyGuard RSA key used for the mTLS handshake is managed by Windows CNG (Cryptography Next Generation) and is physically non-exportable. Implementing this in a native Node.js addon (NAPI/node-gyp) was evaluated and rejected for the following reasons:

1. **No built-in CNG API in Node.js.** Creating and using a KeyGuard key requires `NCryptOpenKey` / `NCryptCreatePersistedKey` — Windows CNG APIs that Node.js does not expose.

2. **Native addon complexity.** A NAPI addon could call CNG in theory, but it would need to be compiled and distributed as a `.node` binary for every combination of Node.js version, OS version, and architecture. This requires a separate build/publish pipeline and ongoing N-API ABI compatibility maintenance.

3. **Node `tls` module limitation.** Even if the key were exposed as a `CryptoKey` object, Node.js's `tls` module requires in-process exportable key material for the TLS handshake — a CNG-backed key handle cannot be passed to `https.Agent`.

4. **The subprocess is the intended architecture.** The .NET subprocess gives us the full msal-dotnet MSI mTLS stack (KeyGuard, IMDS, MAA, mTLS token request) with minimal code — the same approach msal-dotnet itself uses internally. This is not a temporary bootstrap.

## Limitations

### Downstream mTLS resource calls

The `bindingCertificate` returned in `AuthenticationResult` is the public X.509 certificate (PEM) that Entra STS bound to the access token. It is provided for **informational purposes** — for example, to inspect or log which certificate was used.

**Node.js cannot use this certificate to make downstream mTLS resource calls.** The corresponding KeyGuard private key is non-exportable from Windows CNG, so `https.Agent({ cert, key })` cannot be constructed. Any downstream mTLS connections using the same key material would also need to go through the .NET layer.

This is tracked as future work.

## Support and servicing

`MsalMtlsMsiHelper.exe` is versioned and published as part of this npm package, following the same semver cadence as the rest of msal-js:

- **NuGet version pinning:** The exact versions of `Microsoft.Identity.Client` and `Microsoft.Identity.Client.KeyAttestation` used are pinned in `native/MsalMtlsMsiHelper/MsalMtlsMsiHelper.csproj`.
- **Security updates:** When msal-dotnet releases a security fix affecting the MSI mTLS flow, the helper source must be updated, the binary rebuilt (`npm run build:binaries`), and the npm package republished. This typically results in a **patch version bump**.
- **Breaking API changes:** If msal-dotnet makes breaking changes to `AcquireTokenForManagedIdentity().WithMtlsProofOfPossession()`, the helper must be updated. This would result at minimum in a **minor version bump** of this package.
- **Runtime dependency:** Consumers need the `.NET 8 runtime` installed on the VM (not the SDK). The runtime version requirement will only change if msal-dotnet requires a newer runtime in a future update.



- [`lib/msal-node/docs/mtls-pop.md`](../../lib/msal-node/docs/mtls-pop.md) — full design docs
  for mTLS PoP in msal-node (covers both the CCA/SNI cert path and this Managed Identity path)
- [msal-dotnet mTLS PoP architecture](https://github.com/AzureAD/microsoft-authentication-library-for-dotnet/blob/main/docs/mtlspop_architecture.md)

## License

MIT
