# @azure/msal-node-key-attestation

Pre-built `MsalMtlsMsiHelper.exe` binaries for `@azure/msal-node-mtls-extensions` — KeyGuard attestation support for Managed Identity mTLS Proof-of-Possession (mTLS PoP) on Windows.

## Overview

This package is the **binary companion** to `@azure/msal-node-mtls-extensions`. It ships
`MsalMtlsMsiHelper.exe` and `AttestationClientLib.dll` for `win-x64`, and re-exports all
functions from the core package with the helper path pre-configured so you don't have to
set it manually.

This split mirrors the pattern used by msal-dotnet (`Microsoft.Identity.Client.KeyAttestation`)
and msal-python (`msal-key-attestation`):

| SDK | Core package | Binary / attestation package |
|-----|--------------|-------------------------------|
| msal-node | `@azure/msal-node-mtls-extensions` | `@azure/msal-node-key-attestation` (this package) |
| msal-dotnet | `Microsoft.Identity.Client` | `Microsoft.Identity.Client.KeyAttestation` |
| msal-python | `msal` | `msal-key-attestation` |

## Installation

```bash
npm install @azure/msal-node-key-attestation
```

This package lists `@azure/msal-node-mtls-extensions` as a peer dependency and will install it
automatically.

## Usage

Import `acquireMtlsMsiToken` and `makeMtlsMsiRequest` directly from this package. The binary
path is resolved automatically from this package's `bin/win-x64/` directory — no configuration
needed.

```typescript
import { acquireMtlsMsiToken, makeMtlsMsiRequest } from "@azure/msal-node-key-attestation";

// Step 1 — acquire the mTLS PoP token
const tokenResult = await acquireMtlsMsiToken({
    resource: "https://graph.microsoft.com/",
});

console.log(tokenResult.accessToken);        // mTLS PoP access token
console.log(tokenResult.tokenType);          // "mtls_pop"
console.log(tokenResult.bindingCertificate); // PEM cert bound to the token

// Step 2 — call the downstream resource over mTLS
const response = await makeMtlsMsiRequest({
    url: "https://your-resource.example.com/api/data",
    token: tokenResult.accessToken,
});

console.log(response.status); // 200
```

For full API documentation including all parameters, caching behaviour, and error handling,
see the [`@azure/msal-node-mtls-extensions` README](../msal-node-mtls-extensions/README.md).

### With KeyGuard Attestation (VBS attestation via MAA)

```typescript
const tokenResult = await acquireMtlsMsiToken({
    resource: "https://graph.microsoft.com/",
    withAttestation: true,
});
```

Some VM configurations require VBS attestation. Pass `withAttestation: true` when the IMDS
call fails with `"Attestation Token is missing / empty in the issue credential request"`.

### Advanced: resolve the helper path manually

```typescript
import { getHelperPath } from "@azure/msal-node-key-attestation";
import { acquireMtlsMsiToken } from "@azure/msal-node-mtls-extensions";

// Useful if you need to pass the path to the core functions directly.
const helperPath = getHelperPath();
const tokenResult = await acquireMtlsMsiToken({ resource: "...", helperPath });
```

## Included binaries

| File | Architecture | Description |
|------|-------------|-------------|
| `bin/win-x64/MsalMtlsMsiHelper.exe` | x64 | Framework-dependent .NET 8 binary that handles KeyGuard key creation, CSR generation, IMDS credential issuance, and the mTLS token request |
| `bin/win-x64/AttestationClientLib.dll` | x64 | Native C++ library from `Microsoft.Azure.Security.KeyGuardAttestation` — required for `withAttestation: true` |

Neither file is committed to git. They are built and copied during `npm run build:binaries`
(called automatically by `npm pack`/`npm publish` via `prepack`).

## Building the binaries

```bash
# Requires .NET 8 SDK on PATH
npm run build:binaries
```

This publishes `MsalMtlsMsiHelper.exe` from the .NET source at
`extensions/msal-node-mtls-extensions/native/MsalMtlsMsiHelper/`
and copies `AttestationClientLib.dll` from the NuGet package cache.

## Requirements

| Requirement | Notes |
|---|---|
| **Windows only** | KeyGuard RSA keys require Windows VBS |
| `x64` | Only x64 is currently supported |
| **Azure VM with Managed Identity** | System-assigned or user-assigned |
| **.NET 8 runtime** | Framework-dependent binary — pre-installed on most Azure VM images |

## License

MIT
