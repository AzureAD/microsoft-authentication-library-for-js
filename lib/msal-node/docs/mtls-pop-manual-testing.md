# mTLS PoP — Manual Testing Guide

This guide walks through manually testing both mTLS PoP paths end-to-end.

- **Path 1** — Confidential Client Application (CCA) with an SNI certificate (`@azure/msal-node`)
- **Path 2** — Managed Identity on a Windows Azure VM (`@azure/msal-node-mtls-extensions`)

> **Note:** Path 2 requires an Azure VM with Managed Identity. Path 1 requires an Azure AD app registration with an SNI certificate.

---

## Path 1 — Confidential Client / SNI Certificate

### Prerequisites

- Node.js 18+
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
```

### What to check if it fails

| Error | Likely cause | Fix |
|---|---|---|
| `mtls_pop_certificate_required` | `x5c` or `privateKey` not set | Verify both are populated in `clientCertificate` |
| `mtls_pop_region_required` | `azureRegion` missing from the request | Add `azureRegion: "eastus"` |
| `missing_tenant_id_error` | Using `/common` authority | Use `https://login.microsoftonline.com/{tenantId}` |
| `ECONNREFUSED` / `CERT_INVALID` | Certificate not trusted by Entra | Certificate must be an SNI cert issued by a Microsoft-trusted CA |
| HTTP 401 from downstream service | `Authorization` header format wrong | Use `mtls_pop <token>`, not `Bearer <token>` |

---

## Path 2 — Managed Identity (Windows Azure VM)

### Prerequisites

- An Azure VM running **Windows** (`x64` or `arm64`)
- **Managed Identity enabled** on the VM (System-Assigned or User-Assigned)
- **.NET 8 runtime** installed (check: `dotnet --version`; pre-installed on most Azure VM images)
- Node.js 18+ on the VM
- The `@azure/msal-node-mtls-extensions` package **with the built binary**

> VBS (Virtualization-Based Security) must be enabled on the VM to use `withAttestation: true`.
> Standard Azure VMs support KeyGuard key creation. VBS attestation requires a VBS-enabled VM SKU.

### 1. Build the binary (on a Windows dev machine with .NET 8 SDK)

This step produces the `MsalMtlsMsiHelper.exe` binaries. It must be done on Windows.

```bash
# From the repo root:
cd extensions/msal-node-mtls-extensions
npm run build:binaries
# Output:
#   bin/win-x64/MsalMtlsMsiHelper.exe
#   bin/win-arm64/MsalMtlsMsiHelper.exe
```

### 2. Copy the package to your VM

Copy the entire `extensions/msal-node-mtls-extensions` folder (including `bin/`) to the VM, or `npm pack` it first:

```bash
npm pack
# Produces: azure-msal-node-mtls-extensions-1.0.0.tgz
# scp that tarball to the VM
```

On the VM:
```bash
mkdir mtls-test && cd mtls-test
npm install ../azure-msal-node-mtls-extensions-1.0.0.tgz
```

### 3. Create a test script

```typescript
// test-msi-mtls.ts
import { acquireMtlsMsiToken, clearMtlsMsiTokenCache } from "@azure/msal-node-mtls-extensions";

const RESOURCE = "https://management.azure.com/";

async function main() {
    // --- Test 1: System-Assigned identity, fresh token ---
    console.log("Test 1: Acquiring mTLS PoP token (System-Assigned)...");
    const result = await acquireMtlsMsiToken({ resource: RESOURCE });

    console.log("\n✅ Token acquired");
    console.log("  tokenType:         ", result.tokenType);          // "mtls_pop"
    console.log("  expiresOn:         ", result.expiresOn);
    console.log("  fromCache:         ", result.fromCache);          // false
    console.log("  tenantId:          ", result.tenantId);
    console.log("  bindingCertificate:", result.bindingCertificate?.slice(0, 60), "...");

    // --- Test 2: Cache hit ---
    console.log("\nTest 2: Second call (should hit cache)...");
    const cached = await acquireMtlsMsiToken({ resource: RESOURCE });
    console.log("  fromCache:", cached.fromCache); // true

    // --- Test 3: forceRefresh ---
    console.log("\nTest 3: forceRefresh (should bypass cache)...");
    const fresh = await acquireMtlsMsiToken({ resource: RESOURCE, forceRefresh: true });
    console.log("  fromCache:", fresh.fromCache); // false

    // --- Test 4: clearMtlsMsiTokenCache ---
    console.log("\nTest 4: clearMtlsMsiTokenCache then re-acquire...");
    clearMtlsMsiTokenCache();
    const afterClear = await acquireMtlsMsiToken({ resource: RESOURCE });
    console.log("  fromCache:", afterClear.fromCache); // false

    // --- Test 5: User-Assigned identity (if configured) ---
    // Uncomment and fill in your user-assigned client ID:
    //
    // console.log("\nTest 5: User-Assigned identity...");
    // const ua = await acquireMtlsMsiToken({
    //     resource: RESOURCE,
    //     identityType: "UserAssigned",
    //     identityId: "YOUR_USER_ASSIGNED_CLIENT_ID",
    // });
    // console.log("  tokenType:", ua.tokenType);

    // --- Test 6: With VBS attestation (requires VBS-enabled VM) ---
    // console.log("\nTest 6: With attestation...");
    // const attested = await acquireMtlsMsiToken({
    //     resource: RESOURCE,
    //     withAttestation: true,
    // });
    // console.log("  tokenType:", attested.tokenType);

    console.log("\n✅ All tests passed");
}

main().catch((err) => {
    console.error("\n❌ Error:", err.message);
    if (err.errorCode) console.error("  errorCode:", err.errorCode);
    process.exit(1);
});
```

### 4. Run on the VM

```powershell
npx ts-node test-msi-mtls.ts
```

### Expected output

```
Test 1: Acquiring mTLS PoP token (System-Assigned)...

✅ Token acquired
  tokenType:          mtls_pop
  expiresOn:          2026-03-27T19:00:00.000Z
  fromCache:          false
  tenantId:           xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  bindingCertificate: -----BEGIN CERTIFICATE-----
MIIDxTCCAq2gAwIBAgIU...

Test 2: Second call (should hit cache)...
  fromCache: true

Test 3: forceRefresh (should bypass cache)...
  fromCache: false

Test 4: clearMtlsMsiTokenCache then re-acquire...
  fromCache: false

✅ All tests passed
```

### What to check if it fails

| Error | Likely cause | Fix |
|---|---|---|
| `"only supported on Windows"` | Running on Linux/macOS | Must run on a Windows Azure VM |
| `"Unsupported architecture"` | Not `x64` or `arm64` | Check `node -e "console.log(process.arch)"` |
| `"Failed to spawn MsalMtlsMsiHelper"` | Binary missing | Run `npm run build:binaries` and ensure `bin/win-x64/` is present |
| `"You must be running within an Azure VM"` | IMDS not reachable | Ensure VM has Managed Identity enabled; IMDS is at `169.254.169.254` |
| `dotnet: command not found` | .NET 8 runtime not installed | Install via [.NET install script](https://dot.net/v1/dotnet-install.ps1) |
| `MsalException` from the helper | Token acquisition failed | Check the `error_description` — commonly a misconfigured Managed Identity or preview feature not enabled for the subscription |

### Checking the binary manually

You can run `MsalMtlsMsiHelper.exe` directly to isolate issues from Node.js:

```powershell
.\bin\win-x64\MsalMtlsMsiHelper.exe --resource https://management.azure.com/ --identity-type SystemAssigned
# On success: prints JSON with access_token, token_type, expires_in, binding_certificate
# On failure: prints JSON error to stderr and exits non-zero
```

---

## Verifying the token is actually mTLS PoP (not Bearer)

Decode the access token at [jwt.ms](https://jwt.ms) or with the snippet below and confirm:

```typescript
function inspectToken(accessToken: string) {
    const payload = JSON.parse(
        Buffer.from(accessToken.split(".")[1], "base64url").toString("utf8")
    );
    console.log("cnf claim (cert binding):", payload.cnf);   // should be present
    console.log("token_type in claims:    ", payload.token_type ?? payload.tt);
}
```

An mTLS PoP token will have a `cnf` claim containing the certificate thumbprint (`x5t#S256`), which is what Entra STS uses to verify the binding.

---

## See also

- [mtls-pop.md](./mtls-pop.md) — Full design guide and API reference
- [certificate-credentials.md](./certificate-credentials.md) — Setting up certificate credentials
- [sni.md](./sni.md) — SNI certificate setup
- [extensions/msal-node-mtls-extensions/README.md](../../../extensions/msal-node-mtls-extensions/README.md) — Package docs for the Managed Identity path
