# KeyGuard N-API Addon: Node.js-Only Alternative — Feasibility Analysis

> **Context:** This document analyzes an alternative architecture where a native Node.js N-API addon replaces the `.exe` subprocess entirely, keeping the mTLS PoP Managed Identity flow within a single Node.js process with no .NET dependency.

## ⛔ Fundamental Blocker — Read This First

**The native N-API addon approach is architecturally blocked by Node.js's TLS stack, regardless of how well the addon is implemented.**

The mTLS Proof-of-Possession flow requires performing a TLS handshake using the binding certificate's private key. That private key **is** the KeyGuard key — this is not an implementation choice, it is a protocol requirement. `Csr.cs` in MSAL .NET confirms it: the CSR is signed with the KeyGuard key, IMDS issues a cert bound to that public key, and the same key must be presented at TLS time. There is no separate software key.

Node.js's TLS stack is built on OpenSSL. OpenSSL requires key bytes in an `EVP_PKEY` structure — it computes signatures in-process. KeyGuard keys are VBS-protected: the raw bytes never leave the VBS enclave. The two systems are architecturally incompatible:

```
OpenSSL (Node.js TLS):  EVP_PKEY → extract key bytes → compute signature in-process
CNG/KeyGuard:           NCRYPT_KEY_HANDLE → delegate to VBS → return signature bytes only
```

There is no bridge. Schannel (the Windows TLS provider that CAN use `NCRYPT_KEY_HANDLE`) is not exposed to Node.js. Building a full Schannel wrapper as an N-API addon would be a substantial independent project and would effectively replace Node.js's entire TLS stack for this use case.

**Conclusion: the `.exe` subprocess is not merely convenient — it is the only viable architecture for the TLS handshake step as long as the binding cert's private key must be a KeyGuard key.** Everything below is a record of the investigation that led to this conclusion.

---

## Background

The msal-node mTLS Proof-of-Possession flow for managed identity on Azure VMs requires:

1. Creating an RSA key protected by KeyGuard (Windows VBS)
2. Getting an attestation JWT from Azure Microsoft Attestation (MAA) proving the key is hardware-protected
3. Generating a CSR signed with the KeyGuard key, submitting it to IMDS `/metadata/identity/issuecredential` along with the attestation JWT
4. Receiving a binding certificate back from IMDS
5. Using that binding certificate (with the KeyGuard private key) to perform an mTLS handshake against the Entra token endpoint

Today, steps 1–5 are handled by `MsalMtlsMsiHelper.exe`, a .NET subprocess. The question investigated here is whether a native Node.js N-API addon could replace the subprocess.

---

## What We Learned From the MSAL .NET Source

### Creating a KeyGuard Key

KeyGuard protection is activated via the standard **Microsoft Software Key Storage Provider** with two undocumented `CngKeyCreationOptions` flags:

```c
// Raw NCrypt C calls (flags pass through directly from .NET CngKeyCreationOptions)
NCryptOpenStorageProvider(&hProvider, L"Microsoft Software Key Storage Provider", 0);

NCryptCreatePersistedKey(hProvider, &hKey, NCRYPT_RSA_ALGORITHM, L"KeyGuardRSAKey", 0,
    NCRYPT_OVERWRITE_KEY_FLAG |
    0x00020000 |   // NCryptUseVirtualIsolationFlag — activates VBS isolation
    0x00040000);   // NCryptUsePerBootKeyFlag — key is lost on reboot

NCryptSetProperty(hKey, NCRYPT_LENGTH_PROPERTY, (PBYTE)&2048, sizeof(DWORD), 0);
NCryptFinalizeKey(hKey, 0);
```

Verify KeyGuard protection by reading the `"Virtual Iso"` CNG property — `byte[0] != 0` means VBS-protected.

Key points:
- There is **no separate KeyGuard KSP** — it is the standard Software KSP with flags
- The `0x00020000` and `0x00040000` flags are **undocumented** but confirmed via MSAL .NET's `WindowsCngKeyOperations.cs`
- Requires **Windows Server 2022+** with VBS/HVCI enabled
- The key is **per-boot** — it is recreated on every process start after a reboot (`WindowsManagedIdentityKeyProvider.cs` handles this with a named key open/recreate pattern)

### Attestation — AttestationClientLib.dll

The `Microsoft.Azure.Security.KeyGuardAttestation` NuGet package ships `AttestationApi.h`, a public C header:

```c
long InitAttestationLib(AttestationLogInfo* info);

long AttestKeyGuardImportKey(
    const char*       attestation_endpoint,  // MAA regional endpoint (from IMDS metadata)
    const char*       auth_token,            // NULL — DLL authenticates internally via TPM/AK cert
    const char*       client_payload,        // NULL
    NCRYPT_KEY_HANDLE import_key_handle,      // the CNG key handle from above
    char**            attestation_token,      // [out] MAA JWT
    const char*       client_id
);

void FreeAttestationToken(char* token);
void UninitAttestationLib();
```

The API is `extern "C" __cdecl` — no COM, no .NET interop. Callable from a Node.js N-API addon via `LoadLibrary` + `GetProcAddress`. The `auth_token` is `NULL` in both the prototype and production MSAL .NET code — the DLL authenticates to MAA internally using the machine's TPM/AK certificate.

### The IMDS Flow

From `ImdsV2ManagedIdentitySource.cs`, the complete flow is:

1. `GET /metadata/identity/getplatformmetadata` → returns `attestationEndpoint`, `clientId`, `tenantId`, `cuId`
2. Create KeyGuard key → get `NCRYPT_KEY_HANDLE`
3. Call `AttestKeyGuardImportKey(attestationEndpoint, NULL, NULL, handle, &jwt, clientId)` → get MAA JWT
4. Generate CSR signed with KeyGuard key → get CSR PEM
5. `POST /metadata/identity/issuecredential` with `{ "csr": "...", "attestation_token": "..." }` → get binding cert
6. Attach KeyGuard private key to cert → `X509Certificate2` with `NCRYPT_KEY_HANDLE` as private key
7. Use that cert for mTLS handshake → get Entra access token

Step 6 is where the TLS blocker lives. `Csr.cs` line 41 (`return (rawCsr, rsa)`) confirms the `privateKey` returned is the same `RSACng` wrapping the KeyGuard handle. `AttachPrivateKeyToCert` binds that same handle to the issued cert. The TLS handshake in step 7 uses this handle — which OpenSSL cannot replicate.

### Non-Attested Path (Already Works in Node.js)

`ImdsV2ManagedIdentitySource.cs` lines 265–276 show that attestation is **skipped entirely for non-KeyGuard keys**. The CSR is posted to IMDS without an `attestation_token`. The returned cert uses the software key for TLS. This path works today in pure Node.js — no native addon needed. The KeyGuard path is an additional security tier, not the baseline.

---

## Why a Native N-API Addon Is Feasible for Steps 1–4

Despite the TLS blocker, an N-API addon could handle the pre-TLS steps. This is worth understanding for future reference.

### Precedent: The DPAPI Addon

`msal-node-extensions` already ships a working N-API addon (`dpapi-addon`) that calls Windows-only APIs (`CryptProtectData`/`CryptUnprotectData`) using `node-addon-api`. The build system (`binding.gyp`), TypeScript wrapper pattern, cross-platform stub (`dpapi_not_supported.cpp`), and prebuilt binary distribution are all solved. A KeyGuard addon would follow the exact same structure.

### What the Addon Would Expose

```typescript
// createKeyGuardKey(): creates or opens the named KeyGuard key,
//   returns public key bytes (DER) for CSR generation in JS
createKeyGuardKey(): Buffer;

// getAttestationJwt(): calls AttestKeyGuardImportKey with the open key handle
//   returns the MAA JWT string
getAttestationJwt(attestationEndpoint: string, clientId: string): string;

// signData(): signs arbitrary bytes with the KeyGuard key (for CSR signing)
signData(data: Buffer): Buffer;
```

The addon would hold the `NCRYPT_KEY_HANDLE` internally across calls (or reopen by name each time). CSR generation and IMDS HTTP calls could remain in TypeScript.

### Per-Node.js-Version Binary Matrix

The one real operational cost: `.node` binaries are ABI-bound to Node.js major versions. Prebuilt binaries must be published for each supported version (18, 20, 22, ...) × architecture (x64). The DPAPI addon already manages this.

---

## Full Pros/Cons Comparison

### Current Approach: `.exe` Subprocess

| | |
|---|---|
| ✅ Already implemented and working | |
| ✅ Isolated crash domain — subprocess crash doesn't kill Node.js process | |
| ✅ Handles TLS natively via Schannel + CNG — the only viable path | |
| ✅ No per-Node.js-version binary matrix | |
| ✅ Easy to update independently of the npm package | |
| ❌ Requires .NET runtime on the machine | |
| ❌ Subprocess spawn overhead per operation | |
| ❌ External `.exe` must be deployed and trusted alongside the npm package | |
| ❌ IPC between Node.js and subprocess is an additional failure surface | |
| ❌ Two codebases to maintain (.NET + TypeScript) | |
| ❌ Monolithic subprocess prevents package separation — both MSAL .NET and MSAL Python split the native attestation dependency into an optional second package (`Microsoft.Identity.Client.KeyAttestation` / `msal-key-attestation`) so that Azure SDK consumers can use MSAL core without taking a native binary dependency. Because the subprocess handles key creation, attestation, and TLS atomically, the same separation cannot be applied here — all consumers of `msal-node-mtls-extensions` must take the full package including the .NET binary, even if they don't need KeyGuard attestation. | |

### Native N-API Addon

| | |
|---|---|
| ✅ In-process, no spawn overhead | |
| ✅ Single npm package, no external binary to deploy | |
| ✅ No .NET runtime required | |
| ✅ Same pattern as existing DPAPI addon — team knows the toolchain | |
| ✅ Eliminates IPC surface | |
| ❌ **Cannot perform TLS with KeyGuard key — fundamental blocker** | |
| ❌ Per-Node.js-version prebuilt binaries required | |
| ❌ C++ crash takes down the Node.js process | |
| ❌ `AttestationClientLib.dll` must still be present on the machine | |
| ❌ More implementation work than the subprocess approach | |

---

## Summary

The N-API addon is technically implementable for key creation and attestation (steps 1–4), but it **cannot solve step 5** (TLS handshake with KeyGuard key) without replacing Node.js's TLS stack with Schannel — an entirely separate project.

The `.exe` subprocess solves all five steps today. It is the correct architecture for this feature. The N-API addon path would only make sense if the protocol were changed so that IMDS accepted an ephemeral software key for TLS while the KeyGuard key served only as an attestation proof — a server-side protocol change outside our control.
