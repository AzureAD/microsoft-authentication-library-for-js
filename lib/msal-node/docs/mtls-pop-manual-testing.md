# mTLS PoP — Manual Testing Guide

This guide walks through manually testing both mTLS PoP paths end-to-end.

- **Path 1** — Confidential Client Application (CCA) with an SNI certificate (`@azure/msal-node`)
- **Path 2** — Managed Identity on a Windows Azure VM (`@azure/msal-node-key-attestation`)

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

- An Azure VM running **Windows** (`x64` only)
- **Managed Identity enabled** on the VM (System-Assigned or User-Assigned)
- **Node.js 20+** on the VM
- The `@azure/msal-node-mtls-extensions` package installed (see steps below)

> VBS (Virtualization-Based Security) must be enabled on the VM for `withAttestation: true`.
> Standard Azure VMs support KeyGuard key creation. VBS attestation requires a VBS-enabled VM SKU.

> **No .NET runtime required.** The package uses a C++ N-API addon (`msal_mtls_win.node`) loaded directly by Node.js.

### Step 0 — Verify the VM is ready

Run these on the VM before starting:

```powershell
# Confirm Managed Identity is reachable
Invoke-RestMethod `
    -Uri "http://169.254.169.254/metadata/instance?api-version=2021-02-01" `
    -Headers @{Metadata="true"} | Select-Object -ExpandProperty compute | Select-Object name, location

# Confirm Node.js >= 20
node --version

# Confirm architecture
node -e "console.log(process.arch)"   # must be x64
```

### Step 1 — Install the package on the VM

```powershell
mkdir C:\mtls-test
cd C:\mtls-test
npm init -y
npm install @azure/msal-node-mtls-extensions

# Verify the native addon is present
Test-Path "node_modules\@azure\msal-node-mtls-extensions\bin\win-x64\msal_mtls_win.node"
# must print True
```

> If `withAttestation: true` is needed, also place `AttestationClientLib.dll` in the same `bin/win-x64/` directory. Obtain it from the `Microsoft.Azure.Security.KeyGuardAttestation` NuGet package at `runtimes/win-x64/native/AttestationClientLib.dll`.

### Step 2 — Create the Node.js test script

```javascript
// test-mtls.mjs  (ESM — run with: node test-mtls.mjs)
import { MtlsManagedIdentityApplication } from "@azure/msal-node-mtls-extensions";

// Resources confirmed to support mtls_pop tokens:
//   https://graph.microsoft.com/   ✅
//   https://vault.azure.net/       ✅
// Note: management.azure.com does NOT support mtls_pop in all subscriptions (AADSTS392196)
const RESOURCE = "https://graph.microsoft.com/";

// Set to true if IMDS returns "Attestation Token is missing / empty"
const WITH_ATTESTATION = false;

const app = new MtlsManagedIdentityApplication({ withAttestation: WITH_ATTESTATION });

async function main() {
    console.log("=== Test 1: Fresh token (System-Assigned) ===");
    const t1 = await app.acquireToken({ resource: RESOURCE });
    console.log("  tokenType:         ", t1.tokenType);          // mtls_pop
    console.log("  expiresOn:         ", t1.expiresOn);
    console.log("  fromCache:         ", t1.fromCache);          // false
    console.log("  tenantId:          ", t1.tenantId);
    console.log("  bindingCertificate:", t1.bindingCertificate?.split("\n")[1]?.slice(0, 40) + "...");

    console.log("\n=== Test 2: Cache hit ===");
    const t2 = await app.acquireToken({ resource: RESOURCE });
    console.log("  fromCache:", t2.fromCache);   // true

    console.log("\n=== Test 3: forceRefresh ===");
    const t3 = await app.acquireToken({ resource: RESOURCE, forceRefresh: true });
    console.log("  fromCache:", t3.fromCache);   // false

    console.log("\n=== Test 4: clearTokenCache ===");
    app.clearTokenCache();
    const t4 = await app.acquireToken({ resource: RESOURCE });
    console.log("  fromCache:", t4.fromCache);   // false

    console.log("\n=== Test 5: Different resource (vault.azure.net) ===");
    const t5 = await app.acquireToken({ resource: "https://vault.azure.net/" });
    console.log("  tokenType:", t5.tokenType);   // mtls_pop
    console.log("  fromCache:", t5.fromCache);   // false

    console.log("\n=== Test 6: Inspect cnf claim (proves cert binding) ===");
    const payload = JSON.parse(Buffer.from(t1.accessToken.split(".")[1], "base64url").toString());
    console.log("  cnf claim:", JSON.stringify(payload.cnf));   // x5t#S256 must be present
    if (!payload.cnf?.["x5t#S256"]) throw new Error("cnf / x5t#S256 claim missing!");

    console.log("\n✅ All tests passed");
}

main().catch(err => {
    console.error("\n❌ FAILED:", err.message);
    process.exit(1);
});
```

### Step 3 — Run on the VM

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

=== Test 4: clearTokenCache ===
  fromCache: false

=== Test 5: Different resource (separate cache entry) ===
  tokenType:  mtls_pop
  fromCache:  false

=== Test 6: Inspect cnf claim (proves cert binding) ===
  cnf claim:  {"x5t#S256":"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}

✅ All tests passed
```

---

### Step 4 — Test downstream mTLS calls with `sendGetRequestAsync`

The native addon uses WinHTTP (which uses Schannel) to present the client certificate over mTLS. This works for servers that use **required mutual TLS** — they must send a TLS `CertificateRequest` during the handshake.

> `mtlstb.graph.microsoft.com` is the dedicated required-mTLS Microsoft Graph endpoint. Standard `graph.microsoft.com` uses optional mTLS and will NOT send a `CertificateRequest`, so no client cert is presented.

```javascript
// test-mtls-downstream.mjs
import { MtlsManagedIdentityApplication } from "@azure/msal-node-mtls-extensions";

const RESOURCE         = "https://graph.microsoft.com/";
const DOWNSTREAM_URL   = "https://mtlstb.graph.microsoft.com/v1.0/applications?$top=5";
const WITH_ATTESTATION = false;

const app = new MtlsManagedIdentityApplication({ withAttestation: WITH_ATTESTATION });

async function main() {
    console.log("=== Acquire mTLS PoP token ===");
    const tokenResult = await app.acquireToken({ resource: RESOURCE });
    console.log("  tokenType:", tokenResult.tokenType); // mtls_pop
    console.log("  fromCache:", tokenResult.fromCache);

    console.log("\n=== Test: sendGetRequestAsync (required-mTLS endpoint) ===");
    const response = await app.sendGetRequestAsync(DOWNSTREAM_URL, {
        headers: {
            Authorization: `mtls_pop ${tokenResult.accessToken}`,
        },
    });
    console.log("  status:", response.status);
    // 200: success; 403: auth succeeded but MI lacks permissions (expected)
    if (response.status !== 200 && response.status !== 403) {
        throw new Error(`Unexpected status ${response.status}: ${JSON.stringify(response.body)}`);
    }
    console.log("  body (first 200):", JSON.stringify(response.body).slice(0, 200));

    console.log("\n✅ Downstream mTLS test passed (auth succeeded)");
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

=== Test: sendGetRequestAsync (required-mTLS endpoint) ===
  status: 403
  body (first 200): {"error":{"code":"Authorization_RequestDenied","message":"Insufficient privileges...

✅ Downstream mTLS test passed (auth succeeded)
```

A `403` response confirms the mTLS authentication succeeded — the client certificate was presented and accepted; the managed identity simply lacks Graph permissions. A `200` would also be a pass.

### What to check if it fails

| Error | Likely cause | Fix |
|---|---|---|
| `Cannot find module 'msal_mtls_win.node'` | Native addon missing | Verify `bin/win-x64/msal_mtls_win.node` is present in the package |
| `"You must be running within an Azure VM"` | IMDS not reachable / MI not enabled | Enable System-Assigned MI in Azure Portal → VM → Identity |
| `"KeyGuard key creation failed"` | VBS not enabled | Use a VBS-enabled VM SKU |
| `"Attestation Token is missing / empty"` | VM requires VBS attestation | Set `withAttestation: true` |
| HTTP 401 `MtlsMissingClientCertificate` | Server uses optional mTLS — no `CertificateRequest` sent | Switch to `mtlstb.graph.microsoft.com` or another required-mTLS endpoint |
| `AADSTS392196` | Resource not configured for mTLS PoP | Use `https://graph.microsoft.com/` or `https://vault.azure.net/` |

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
- [extensions/msal-node-key-attestation/README.md](../../../extensions/msal-node-key-attestation/README.md) — Package docs for the binary/attestation package
- [extensions/msal-node-mtls-extensions/README.md](../../../extensions/msal-node-mtls-extensions/README.md) — Package docs for the core Managed Identity TypeScript package

