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
- `x64` or `arm64` architecture
- Azure VM with a Managed Identity configured

## Installation

```bash
npm install @azure/msal-node-mtls-extensions
```

## Usage

### System-Assigned Managed Identity

```typescript
import { acquireMtlsMsiToken } from "@azure/msal-node-mtls-extensions";

const result = await acquireMtlsMsiToken({
    resource: "https://management.azure.com/",
});

console.log(result.accessToken);    // mTLS PoP access token
console.log(result.tokenType);      // "mtls_pop"
console.log(result.bindingCertificate); // PEM cert bound to the token
```

### User-Assigned Managed Identity

```typescript
const result = await acquireMtlsMsiToken({
    resource: "https://management.azure.com/",
    identityType: "UserAssigned",
    identityId: "your-client-id-or-resource-id",
});
```

### With KeyGuard Attestation (VBS attestation via MAA)

```typescript
const result = await acquireMtlsMsiToken({
    resource: "https://management.azure.com/",
    withAttestation: true, // includes MAA JWT proving key is hardware-backed
});
```

## API

### `acquireMtlsMsiToken(request: MtlsMsiTokenRequest): Promise<AuthenticationResult>`

Acquires an mTLS PoP access token for a Managed Identity.

| Parameter | Type | Default | Description |
|---|---|---|---|
| `resource` | `string` | required | Azure resource URI |
| `identityType` | `"SystemAssigned" \| "UserAssigned"` | `"SystemAssigned"` | Identity type |
| `identityId` | `string` | — | Client/resource ID for UserAssigned |
| `withAttestation` | `boolean` | `false` | Include MAA attestation |
| `correlationId` | `string` | — | Optional GUID for telemetry |

### `getPlatformMetadata(): Promise<PlatformMetadata>`

Calls the IMDS `/metadata/identity/getplatformmetadata` endpoint. Use this to inspect the
VM's managed identity metadata independently.

## How it works

```
Node.js
  ├─[1] GET /metadata/identity/getplatformmetadata  (plain HTTP to IMDS)
  ├─[2] spawn MsalMtlsMsiHelper.exe
  │       ├─ Get/create KeyGuard RSA key (Windows CNG / VBS)
  │       ├─ Generate CSR (embedded clientId/tenantId/cuId)
  │       ├─ [optional] MAA attestation via AttestationClientLib.dll
  │       ├─ POST /metadata/identity/issuecredential → X.509 binding cert
  │       └─ POST {mtlsEndpoint}/{tenantId}/oauth2/v2.0/token (mTLS)
  │             → { access_token, token_type, expires_in }
  └─[3] Return AuthenticationResult
```

## Bundled binary

`MsalMtlsMsiHelper.exe` is a self-contained .NET 8 application bundled at
`bin/win-{arch}/MsalMtlsMsiHelper.exe`. It wraps
[`Microsoft.Identity.Client`](https://learn.microsoft.com/en-us/azure/active-directory/develop/msal-net-migration)
with the
[`Microsoft.Identity.Client.KeyAttestation`](https://www.nuget.org/packages/Microsoft.Identity.Client.KeyAttestation)
extension, which provides hardware-backed key management and attestation support.

**No .NET runtime is required on the target VM** — the binary is self-contained.

## See also

- [`lib/msal-node/docs/mtls-pop.md`](../../lib/msal-node/docs/mtls-pop.md) — full design docs
  for mTLS PoP in msal-node (covers both the CCA/SNI cert path and this Managed Identity path)
- [msal-dotnet mTLS PoP architecture](https://github.com/AzureAD/microsoft-authentication-library-for-dotnet/blob/main/docs/mtlspop_architecture.md)

## License

MIT
