# mTLS PoP — Manual Testing Guide

This guide walks through manually testing both mTLS PoP paths end-to-end.

- **Path 1** — Confidential Client Application (CCA) with an SNI certificate (`@azure/msal-node`)
- **Path 2** — Managed Identity on a Windows Azure VM (`@azure/msal-node-mtls-extensions`)

> **Note:** Path 2 requires an Azure VM with Managed Identity. Path 1 requires an Azure AD app registration with an SNI certificate.

---

## Path 1 — Confidential Client / SNI Certificate

### Prerequisites

- Node.js 20+
- An Azure AD **app registration** with an SNI certificate registered
- A **tenanted authority** — `/common` and `/organizations` are not supported
- The Azure **region** your workload runs in (e.g. `eastus`)
- The certificate PEM and private key files from your SNI cert

If you don't have a cert yet, see [certificate-credentials.md](./certificate-credentials.md) and [sni.md](./sni.md).

### 1. Install

```bash
npm install @azure/msal-node
```

### 2. Create a test script

```typescript
// test-cca-mtls.ts
import * as fs from "fs";
import * as https from "https";
import { ConfidentialClientApplication, AuthenticationScheme } from "@azure/msal-node";

const CERT_PEM   = fs.readFileSync("cert.pem", "utf8");   // x5c (public cert)
const CERT_KEY   = fs.readFileSync("cert.key", "utf8");   // private key
const CLIENT_ID  = "YOUR_APP_CLIENT_ID";
const TENANT_ID  = "YOUR_TENANT_ID";
const REGION     = "eastus";                               // must match your app's region
const SCOPE      = "https://management.azure.com/.default";

async function main() {
    const cca = new ConfidentialClientApplication({
        auth: {
            clientId: CLIENT_ID,
            authority: `https://login.microsoftonline.com/${TENANT_ID}`,
            clientCertificate: {
                thumbprintSha256: computeThumbprint(CERT_PEM), // see helper below
                privateKey: CERT_KEY,
                x5c: CERT_PEM,
            },
        },
    });

    console.log("Acquiring mTLS PoP token...");
    const result = await cca.acquireTokenByClientCredential({
        scopes: [SCOPE],
        azureRegion: REGION,
        authenticationScheme: AuthenticationScheme.MTLS_POP,
    });

    if (!result) throw new Error("No token returned");

    console.log("\n✅ Token acquired");
    console.log("  tokenType:         ", result.tokenType);        // "mtls_pop"
    console.log("  expiresOn:         ", result.expiresOn);
    console.log("  fromCache:         ", result.fromCache);        // false on first call
    console.log("  bindingCertificate:", result.bindingCertificate?.slice(0, 60), "...");

    // --- Second call: verify cache ---
    console.log("\nAcquiring again (should hit cache)...");
    const cached = await cca.acquireTokenByClientCredential({
        scopes: [SCOPE],
        azureRegion: REGION,
        authenticationScheme: AuthenticationScheme.MTLS_POP,
    });
    console.log("  fromCache:", cached?.fromCache); // true

    // --- Inspect cnf claim ---
    const payload = JSON.parse(Buffer.from(result.accessToken.split(".")[1], "base64url").toString());
    console.log("\n  cnf claim:", JSON.stringify(payload.cnf)); // x5t#S256 proves cert binding

    // --- Optional: make a downstream mTLS API call ---
    // The token is bound to CERT_PEM / CERT_KEY.
    // Downstream services that validate PoP binding expect an mTLS connection
    // using that same certificate.
    const agent = new https.Agent({ cert: CERT_PEM, key: CERT_KEY });
    console.log("\nhttps.Agent configured with binding cert — ready for downstream mTLS calls");
    console.log("Authorization header: mtls_pop", result.accessToken.slice(0, 20), "...");
}

// Compute SHA-256 thumbprint from a PEM cert
function computeThumbprint(pem: string): string {
    const { createHash } = require("crypto");
    const base64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "");
    return createHash("sha256").update(Buffer.from(base64, "base64")).digest("hex");
}

main().catch(console.error);
```

### 3. Run

```bash
npx ts-node test-cca-mtls.ts
```

### Expected output

```
Acquiring mTLS PoP token...

✅ Token acquired
  tokenType:          mtls_pop
  expiresOn:          2026-03-27T19:00:00.000Z
  fromCache:          false
  bindingCertificate: -----BEGIN CERTIFICATE-----
MIIDxTCCAq2gAwIBAgIU...

Acquiring again (should hit cache)...
  fromCache: true

  cnf claim: {"x5t#S256":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
```

### What to check if it fails

| Error | Likely cause | Fix |
|---|---|---|
| `mtls_pop_certificate_required` | `x5c` or `privateKey` not set | Verify both are populated in `clientCertificate` |
| `missing_tenant_id_error` | Using `/common` authority | Use `https://login.microsoftonline.com/{tenantId}` |
| `ECONNREFUSED` / `CERT_INVALID` | Certificate not trusted by Entra | Certificate must be an SNI cert issued by a Microsoft-trusted CA |
| HTTP 401 from downstream service | `Authorization` header format wrong | Use `mtls_pop <token>`, not `Bearer <token>` |

---

## Path 2 — Managed Identity (Windows Azure VM)

### Prerequisites

- An Azure VM running **Windows** (`x64` only; see [README](../../../extensions/msal-node-mtls-extensions/README.md#requirements))
- **Managed Identity enabled** on the VM (System-Assigned or User-Assigned)
- **.NET 8 runtime** installed — check with `dotnet --version` (pre-installed on most Azure VM images)
- **Node.js 20+** on the VM — check with `node --version`
- The `@azure/msal-node-mtls-extensions` package **with the built binary** (see build steps below)

> VBS (Virtualization-Based Security) must be enabled on the VM to use `withAttestation: true`.
> Standard Azure VMs support KeyGuard key creation. VBS attestation requires a VBS-enabled VM SKU.

### Step 0 — Verify the VM is ready

Run these on the VM before starting:

```powershell
# Confirm Managed Identity is reachable
Invoke-RestMethod `
    -Uri "http://169.254.169.254/metadata/instance?api-version=2021-02-01" `
    -Headers @{Metadata="true"} | Select-Object -ExpandProperty compute | Select-Object name, location

# Confirm .NET 8 runtime
dotnet --version   # must print 8.x.x

# Confirm Node.js >= 20
node --version

# Confirm architecture
node -e "console.log(process.arch)"   # must be x64
```

If .NET 8 is missing:
```powershell
Invoke-WebRequest -Uri https://dot.net/v1/dotnet-install.ps1 -OutFile dotnet-install.ps1
.\dotnet-install.ps1 -Channel 8.0 -Runtime dotnet
```

### Step 1 — Build on your dev machine (Windows, needs .NET 8 SDK)

The binary must be built on a Windows machine with the **.NET 8 SDK** installed (not just the runtime).

```powershell
# From the repo root:
git clone https://github.com/AzureAD/microsoft-authentication-library-for-js.git
cd microsoft-authentication-library-for-js
git checkout rginsburg/mtls_pop
npm install

# Build msal-common and msal-node (required dependencies)
npm run build --workspace=@azure/msal-common
npm run build --workspace=@azure/msal-node

# Build the TypeScript for the extensions package
npm run build --workspace=@azure/msal-node-mtls-extensions

# Build the .NET helper binary (win-x64 only)
# Also copies AttestationClientLib.dll to bin/win-x64/ for VBS attestation support
cd extensions\msal-node-mtls-extensions
npm run build:binaries
# Expected output:
#   Building MsalMtlsMsiHelper for win-x64...
#   -> bin/win-x64/MsalMtlsMsiHelper.exe
#   Copying AttestationClientLib.dll to bin/win-x64/

# Verify binaries are present
Test-Path "bin\win-x64\MsalMtlsMsiHelper.exe"      # must print True
Test-Path "bin\win-x64\AttestationClientLib.dll"    # must print True (required for --with-attestation)

# Pack it as a tarball to transfer to the VM
npm pack
# Produces: azure-msal-node-mtls-extensions-1.0.0.tgz
```

### Step 2 — Copy the package to your VM

```powershell
# From your dev machine — copy the tarball to the VM (adjust path as needed):
scp azure-msal-node-mtls-extensions-1.0.0.tgz yourvm:/C:/mtls-test/
```

### Step 3 — Install on the VM

```powershell
# On the VM:
mkdir C:\mtls-test
cd C:\mtls-test
npm init -y
npm install .\azure-msal-node-mtls-extensions-1.0.0.tgz

# Verify the binary unpacked correctly
Test-Path "node_modules\@azure\msal-node-mtls-extensions\bin\win-x64\MsalMtlsMsiHelper.exe"
# must print True
```

### Step 4 — Smoke-test the binary directly

Run `MsalMtlsMsiHelper.exe` directly to confirm the .NET + Managed Identity layer works before involving Node.js.

> **Note:** Not all Azure resources support `mtls_pop` tokens. Use `https://graph.microsoft.com/`
> or `https://vault.azure.net/` for testing — both are confirmed to accept certificate-bound tokens.
> `management.azure.com` returns `AADSTS392196` in many subscriptions.

First, try without attestation:

```powershell
.\node_modules\@azure\msal-node-mtls-extensions\bin\win-x64\MsalMtlsMsiHelper.exe `
    --resource https://graph.microsoft.com/ `
    --identity-type SystemAssigned
```

If that returns `"Attestation Token is missing / empty in the issue credential request"`,
the VM requires VBS attestation. Re-run with `--with-attestation`:

```powershell
.\node_modules\@azure\msal-node-mtls-extensions\bin\win-x64\MsalMtlsMsiHelper.exe `
    --resource https://graph.microsoft.com/ `
    --identity-type SystemAssigned `
    --with-attestation
```

**Expected (success):** JSON printed to stdout:
```json
{"access_token":"eyJ...","token_type":"mtls_pop","expires_in":3599,"binding_certificate":"-----BEGIN CERTIFICATE-----\n..."}
```

**On failure:** JSON printed to stderr, non-zero exit code:
```json
{"error":"some_code","error_description":"details of what went wrong"}
```

| Binary output | Cause | Fix |
|---|---|---|
| `"You must be running within an Azure VM"` | IMDS not reachable / MI not enabled | Enable System-Assigned MI in Azure Portal → VM → Identity |
| `"KeyGuard key creation failed"` | VBS not enabled | Use a VBS-enabled VM SKU |
| `"Attestation Token is missing / empty"` | VM requires VBS attestation | Re-run with `--with-attestation` |
| No output / exits immediately | .NET 8 runtime missing | Run `dotnet-install.ps1` |
| `managed_identity_unreachable_network` without `AttestationClientLib.dll` | Native attestation DLL missing | Verify `AttestationClientLib.dll` is in the same directory as `MsalMtlsMsiHelper.exe`; rebuild with `npm run build:binaries` |

### Step 5 — Create the Node.js test script

```javascript
// test-mtls.mjs  (ESM — run with: node test-mtls.mjs)
import { acquireMtlsMsiToken, clearMtlsMsiTokenCache } from "@azure/msal-node-mtls-extensions";

// Resources confirmed to support mtls_pop tokens:
//   https://graph.microsoft.com/   ✅
//   https://vault.azure.net/       ✅
// Note: management.azure.com does NOT support mtls_pop in all subscriptions (AADSTS392196)
const RESOURCE = "https://graph.microsoft.com/";

// Set to true if the smoke test in Step 4 required --with-attestation
const WITH_ATTESTATION = false;

async function main() {
    console.log("=== Test 1: Fresh token (System-Assigned) ===");
    const t1 = await acquireMtlsMsiToken({ resource: RESOURCE, withAttestation: WITH_ATTESTATION });
    console.log("  tokenType:         ", t1.tokenType);          // mtls_pop
    console.log("  expiresOn:         ", t1.expiresOn);
    console.log("  fromCache:         ", t1.fromCache);          // false
    console.log("  tenantId:          ", t1.tenantId);
    console.log("  bindingCertificate:", t1.bindingCertificate?.split("\n")[1]?.slice(0, 40) + "...");

    console.log("\n=== Test 2: Cache hit ===");
    const t2 = await acquireMtlsMsiToken({ resource: RESOURCE, withAttestation: WITH_ATTESTATION });
    console.log("  fromCache:", t2.fromCache);   // true

    console.log("\n=== Test 3: forceRefresh ===");
    const t3 = await acquireMtlsMsiToken({ resource: RESOURCE, withAttestation: WITH_ATTESTATION, forceRefresh: true });
    console.log("  fromCache:", t3.fromCache);   // false

    console.log("\n=== Test 4: clearMtlsMsiTokenCache ===");
    clearMtlsMsiTokenCache();
    const t4 = await acquireMtlsMsiToken({ resource: RESOURCE, withAttestation: WITH_ATTESTATION });
    console.log("  fromCache:", t4.fromCache);   // false

    console.log("\n=== Test 5: Different resource (vault.azure.net) ===");
    const t5 = await acquireMtlsMsiToken({ resource: "https://vault.azure.net/", withAttestation: WITH_ATTESTATION });
    console.log("  tokenType:", t5.tokenType);   // mtls_pop
    console.log("  fromCache:", t5.fromCache);   // false

    console.log("\n=== Test 6: Inspect cnf claim (proves cert binding) ===");
    const payload = JSON.parse(Buffer.from(t1.accessToken.split(".")[1], "base64url").toString());
    console.log("  cnf claim:", JSON.stringify(payload.cnf));   // x5t#S256 must be present
    console.log("  token_type:", payload.token_type ?? payload.tt);
    if (!payload.cnf?.["x5t#S256"]) throw new Error("cnf / x5t#S256 claim missing!");

    // --- Optional: User-Assigned identity (uncomment if configured) ---
    // const ua = await acquireMtlsMsiToken({
    //     resource: RESOURCE,
    //     identityType: "UserAssigned",
    //     identityId: "YOUR_USER_ASSIGNED_CLIENT_ID",
    //     withAttestation: WITH_ATTESTATION,
    // });
    // console.log("\n=== Test 7: User-Assigned ===");
    // console.log("  tokenType:", ua.tokenType);

    console.log("\n✅ All tests passed");
}

main().catch(err => {
    console.error("\n❌ FAILED:", err.message);
    if (err.errorCode) console.error("  errorCode:", err.errorCode);
    process.exit(1);
});
```

### Step 6 — Run on the VM

```powershell
node test-mtls.mjs
```

### Expected output

```
=== Test 1: Fresh token (System-Assigned) ===
  tokenType:          mtls_pop
  expiresOn:          2026-03-30T22:20:00.000Z
  fromCache:          false
  tenantId:           xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  bindingCertificate: MIIDxTCCAq2gAwIBAgIUxxxxxxxxxxxxxxxx...

=== Test 2: Cache hit ===
  fromCache: true

=== Test 3: forceRefresh ===
  fromCache: false

=== Test 4: clearMtlsMsiTokenCache ===
  fromCache: false

=== Test 5: Different resource (separate cache entry) ===
  tokenType:  mtls_pop
  fromCache:  false

=== Test 6: Inspect cnf claim (proves cert binding) ===
  cnf claim:  {"x5t#S256":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}
  token_type: mtls_pop

✅ All tests passed
```

---

### Step 7 — Test downstream mTLS calls with `makeMtlsMsiRequest`

The `bindingCertificate` private key is non-exportable from Windows CNG, so Node.js cannot open the downstream mTLS connection directly. `makeMtlsMsiRequest` routes the call through `MsalMtlsMsiHelper.exe` instead.

> **Requirement:** The downstream resource server **must** use mutual TLS at the TLS layer (i.e., it must send a TLS `CertificateRequest` during the handshake). Most public Azure services (Graph API, Key Vault) use *optional* mutual TLS and will return `MtlsMissingClientCertificate` because the TLS handshake does not include the client certificate when the server doesn't request one. `makeMtlsMsiRequest` is intended for custom services or Azure-internal services that use required mutual TLS.

This step has two parts:

- **Step 7a** — Infrastructure smoke test against Graph (confirms plumbing works; 401 expected)
- **Step 7b** — Full end-to-end test against a local required-mTLS server (confirms `200` with cert binding validated)

---

#### Step 7a — Infrastructure smoke test (optional mTLS, 401 expected)

```javascript
// test-mtls-downstream.mjs
import { acquireMtlsMsiToken, makeMtlsMsiRequest } from "@azure/msal-node-mtls-extensions";

const RESOURCE         = "https://graph.microsoft.com/";
const WITH_ATTESTATION = false; // set true if Step 4 required --with-attestation

async function main() {
    console.log("=== Acquire mTLS PoP token ===");
    const tokenResult = await acquireMtlsMsiToken({
        resource: RESOURCE,
        withAttestation: WITH_ATTESTATION,
    });
    console.log("  tokenType:", tokenResult.tokenType); // mtls_pop
    console.log("  fromCache:", tokenResult.fromCache);

    console.log("\n=== Test: makeMtlsMsiRequest flow (infrastructure test) ===");
    // NOTE: The 401 / MtlsMissingClientCertificate response from Graph confirms that
    // makeMtlsMsiRequest successfully spawned the binary, re-acquired the binding cert,
    // and made the HTTP request. The 401 is Graph rejecting an optional-mTLS connection
    // where no TLS client cert was sent — not a bug in makeMtlsMsiRequest.
    const response = await makeMtlsMsiRequest({
        url: "https://graph.microsoft.com/v1.0/organization",
        token: tokenResult.accessToken,
        resource: RESOURCE,
        withAttestation: WITH_ATTESTATION,
    });
    console.log("  status:", response.status); // 401 from Graph (expected)
    console.log("  body (first 100):", response.body.slice(0, 100));

    console.log("\n✅ makeMtlsMsiRequest infrastructure test passed");
}

main().catch(err => {
    console.error("\n❌ FAILED:", err.message);
    process.exit(1);
});
```

```powershell
node test-mtls-downstream.mjs
```

**Expected output:**

```
=== Acquire mTLS PoP token ===
  tokenType: mtls_pop
  fromCache: false

=== Test: makeMtlsMsiRequest flow (infrastructure test) ===
  status: 401
  body (first 100): {"error":{"code":"InvalidAuthenticationToken","message":"MtlsMissingClientCertificate"...

✅ makeMtlsMsiRequest infrastructure test passed
```

A status of `401` with `MtlsMissingClientCertificate` from Graph confirms the flow works end-to-end (binary spawned, cert re-acquired, HTTP request made).

---

#### Step 7b — Full end-to-end test with local required-mTLS server (200 expected)

A local Node.js HTTPS server (`test-server/mtls-test-server.mjs`) is included in the `@azure/msal-node-mtls-extensions` package. It uses `requestCert: true` to require a client certificate during the TLS handshake, then validates that the certificate's SHA-256 thumbprint matches the `cnf.x5t#S256` claim in the `mtls_pop` token — exactly as a real required-mTLS resource would.

**In one terminal, start the test server:**

```powershell
cd extensions/msal-node-mtls-extensions
node test-server/mtls-test-server.mjs
# ✅ Required-mTLS test server listening on https://127.0.0.1:8443
```

**In another terminal, run the test:**

```javascript
// test-mtls-e2e.mjs
import { acquireMtlsMsiToken, makeMtlsMsiRequest } from "@azure/msal-node-mtls-extensions";

const RESOURCE         = "https://graph.microsoft.com/"; // resource scope for token
const WITH_ATTESTATION = false; // set true if Step 4 required --with-attestation

async function main() {
    console.log("=== Acquire mTLS PoP token ===");
    const tokenResult = await acquireMtlsMsiToken({
        resource: RESOURCE,
        withAttestation: WITH_ATTESTATION,
    });
    console.log("  tokenType:", tokenResult.tokenType); // mtls_pop

    console.log("\n=== Full E2E: makeMtlsMsiRequest → required-mTLS local server ===");
    const response = await makeMtlsMsiRequest({
        url: "https://127.0.0.1:8443/",
        token: tokenResult.accessToken,
        resource: RESOURCE,
        withAttestation: WITH_ATTESTATION,
        allowInsecureTls: true,  // needed for self-signed server cert in local testing only
    });
    console.log("  status:", response.status); // 200
    const body = JSON.parse(response.body);
    console.log("  message:", body.message);
    console.log("  clientCertThumbprint:", body.clientCertThumbprint);

    if (response.status !== 200) throw new Error(`Expected 200, got ${response.status}: ${response.body}`);
    console.log("\n✅ Full end-to-end mTLS PoP test passed — cert binding validated");
}

main().catch(err => {
    console.error("\n❌ FAILED:", err.message);
    process.exit(1);
});
```

```powershell
node test-mtls-e2e.mjs
```

**Expected output:**

```
=== Acquire mTLS PoP token ===
  tokenType: mtls_pop

=== Full E2E: makeMtlsMsiRequest → required-mTLS local server ===
  status: 200
  message: mTLS PoP validation successful
  clientCertThumbprint: xIj8ilFroFCO68G6TPi4JR1l4Etvjo1Rg0gisoIA6mE

✅ Full end-to-end mTLS PoP test passed — cert binding validated
```

The `200` response with `clientCertThumbprint` confirms the complete mTLS PoP flow:
1. Token acquired with `cnf.x5t#S256` bound to the KeyGuard certificate
2. Binary re-acquired the same KeyGuard cert, attached it to the TLS connection
3. Server received the client cert, validated the thumbprint matches the token, and returned `200`

**Troubleshooting downstream calls:**

| Error | Likely cause | Fix |
|---|---|---|
| `"downstream_request_failed"` / process exits non-zero | Binary failed to spawn or crashed | Check binary presence; run the binary smoke-test (Step 4) |
| HTTP 401 `MtlsMissingClientCertificate` from Graph/Key Vault | Server uses optional mTLS — client cert not sent | Expected for public Azure services. Use a required-mTLS server for a real end-to-end test. |
| HTTP 401 `MtlsCertificateMismatch` from local test server | Token `cnf.x5t#S256` doesn't match presented cert | Token and cert were acquired in different sessions — clear cache and re-run |
| HTTP 401 `InvalidAuthenticationToken` other message | Token not accepted | Verify `token` is from `acquireMtlsMsiToken` with correct `resource` |
| `"only supported on Windows"` | Not on a Windows VM | `makeMtlsMsiRequest` requires Windows + the .NET helper |

### What to check if it fails (Node.js layer)

| Error | Likely cause | Fix |
|---|---|---|
| `"only supported on Windows"` | Running on Linux/macOS | Must run on a Windows Azure VM |
| `"Unsupported architecture"` | Not `x64` | Check `node -e "console.log(process.arch)"` — only x64 is supported |
| `"Failed to spawn MsalMtlsMsiHelper"` | Binary missing from package | Rebuild + repack on dev machine; verify `bin/win-x64/` is present in the tarball |
| `MsalException` from the helper | Token acquisition failed | Run the binary smoke-test (Step 4) directly and read the `error_description` |
| Token has no `cnf` claim | Token is Bearer, not mTLS PoP | Check `token_type` in the binary's JSON output |
| `AADSTS392196: The resource application does not support certificate-bound token` | Resource not configured for mTLS PoP | Not all Azure first-party resources support `mtls_pop` tokens. Use `https://graph.microsoft.com/` or `https://vault.azure.net/` as the resource instead — both are confirmed to work. `management.azure.com` does not support mTLS PoP in all subscriptions. |
| `managed_identity_unreachable_network` / `SocketException: An existing connection was forcibly closed` | Outdated MSAL.NET packages | The `.NET` helper was built with an older `Microsoft.Identity.Client` version. Rebuild with `Microsoft.Identity.Client` ≥ 4.83.3 and `Microsoft.Identity.Client.KeyAttestation` ≥ 4.83.3-preview. |

---

## Verifying the token is actually mTLS PoP (not Bearer)

The `cnf` claim with `x5t#S256` is the definitive proof the token is certificate-bound.
Test 6 above inspects it inline. You can also decode any token at [jwt.ms](https://jwt.ms) and
look for:

```json
"cnf": {
    "x5t#S256": "base64url-encoded-sha256-thumbprint-of-binding-cert"
}
```

A plain Bearer token will have no `cnf` claim.

---

## See also

- [mtls-pop.md](./mtls-pop.md) — Full design guide and API reference
- [certificate-credentials.md](./certificate-credentials.md) — Setting up certificate credentials
- [sni.md](./sni.md) — SNI certificate setup
- [extensions/msal-node-mtls-extensions/README.md](../../../extensions/msal-node-mtls-extensions/README.md) — Package docs for the Managed Identity path

