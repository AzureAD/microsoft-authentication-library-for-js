/**
 * test-mtls-managed-identity-app.mjs
 *
 * Manual test for MtlsManagedIdentityApplication (new class-based API).
 *
 * Prerequisites:
 *   1. Build the package first:  cd extensions/msal-node-mtls-extensions && npm run build
 *   2. The test server must be running in another terminal:
 *        node test-server/mtls-test-server.mjs
 *      (uses self-signed certs in test-server/ folder)
 *   3. MsalMtlsMsiHelper.exe must be available via MSAL_MTLS_HELPER_PATH or
 *      @azure/msal-node-key-attestation package.
 *
 * Usage:
 *   # Against local test server (allows insecure TLS):
 *   MSAL_MTLS_HELPER_PATH="bin/win-x64/MsalMtlsMsiHelper.exe" node test-mtls-managed-identity-app.mjs
 *
 *   # Against real Azure endpoint:
 *   node test-mtls-managed-identity-app.mjs --real
 *
 * Expected output:
 *   ✓ acquireToken:  tokenType=mtls_pop  fromCache=false
 *   ✓ acquireToken (cached): fromCache=true
 *   ✓ sendGetRequestAsync: status=200  cert binding validated
 *   ✓ sendGetRequestAsync (headers token): status=200
 *   All tests PASSED
 */

import { createRequire } from "module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const _require = createRequire(import.meta.url);

// Import from built lib/ output (CJS)
const { MtlsManagedIdentityApplication } = _require(
    path.join(__dirname, "lib", "msal-node-mtls-extensions.cjs")
);

const useReal = process.argv.includes("--real");
const WITH_ATTESTATION = process.argv.includes("--with-attestation");

// For real Azure, use a real resource.
// The downstream call still uses the local test server (to test mTLS cert binding).
const RESOURCE = "https://management.azure.com/";

// Token acquisition uses real Entra endpoint; downstream uses local test server.
const DOWNSTREAM_URL = "https://localhost:8443/test";

let pass = 0;
let fail = 0;

function check(label, condition, actual) {
    if (condition) {
        console.log(`✓ ${label}`);
        pass++;
    } else {
        console.error(`✗ ${label}  (got: ${JSON.stringify(actual)})`);
        fail++;
    }
}

async function run() {
    console.log(
        `\n=== MtlsManagedIdentityApplication manual test (${useReal ? "REAL AZURE" : "local test server"}) ===\n`
    );

    /** @type {import('./src/MtlsManagedIdentityApplication.js').MtlsManagedIdentityApplication} */
    const app = new MtlsManagedIdentityApplication({
        withAttestation: WITH_ATTESTATION,
    });

    // ---- Test 1: acquireToken (first call → network) ----
    let result1;
    try {
        result1 = await app.acquireToken({ resource: RESOURCE });
        check("acquireToken tokenType=mtls_pop", result1.tokenType === "mtls_pop", result1.tokenType);
        check("acquireToken fromCache=false", result1.fromCache === false, result1.fromCache);
        check("acquireToken has accessToken", typeof result1.accessToken === "string" && result1.accessToken.length > 0, result1.accessToken);
        check("acquireToken has bindingCertificate", typeof result1.bindingCertificate === "string" && result1.bindingCertificate.length > 0, result1.bindingCertificate);
        console.log(`   tenantId: ${result1.tenantId}`);
        console.log(`   expiresOn: ${result1.expiresOn}`);
    } catch (e) {
        console.error("✗ acquireToken THREW:", e.message);
        fail++;
    }

    // ---- Test 2: acquireToken (second call → cache hit) ----
    if (result1) {
        try {
            const result2 = await app.acquireToken({ resource: RESOURCE });
            check("acquireToken cached: fromCache=true", result2.fromCache === true, result2.fromCache);
            check("acquireToken cached: same token", result2.accessToken === result1.accessToken, result2.accessToken);
        } catch (e) {
            console.error("✗ acquireToken (cached) THREW:", e.message);
            fail++;
        }
    }

    // ---- Test 3: forceRefresh ----
    if (result1) {
        try {
            const result3 = await app.acquireToken({ resource: RESOURCE, forceRefresh: true });
            check("acquireToken forceRefresh: fromCache=false", result3.fromCache === false, result3.fromCache);
        } catch (e) {
            console.error("✗ acquireToken forceRefresh THREW:", e.message);
            fail++;
        }
    }

    // ---- Test 4: sendGetRequestAsync (token via headers) ----
    if (result1) {
        try {
            const resp = await app.sendGetRequestAsync(DOWNSTREAM_URL, {
                headers: {
                    Authorization: `mtls_pop ${result1.accessToken}`,
                },
            });
            check("sendGetRequestAsync status 2xx", resp.status >= 200 && resp.status < 300, resp.status);
            console.log(`   Response status: ${resp.status}`);
            if (typeof resp.body === "string" && resp.body.length < 500) {
                console.log(`   Response body: ${resp.body}`);
            }
        } catch (e) {
            console.error("✗ sendGetRequestAsync THREW:", e.message);
            fail++;
        }
    }

    // ---- Test 5: sendGetRequestAsync (token from cache) ----
    if (result1) {
        try {
            // No Authorization header — app should find the cached token
            const resp = await app.sendGetRequestAsync(DOWNSTREAM_URL);
            check("sendGetRequestAsync (cache token) status 2xx", resp.status >= 200 && resp.status < 300, resp.status);
            console.log(`   Response status (cache token path): ${resp.status}`);
        } catch (e) {
            console.error("✗ sendGetRequestAsync (cache token) THREW:", e.message);
            fail++;
        }
    }

    // ---- Summary ----
    console.log(`\n--- Results: ${pass} passed, ${fail} failed ---\n`);
    if (fail > 0) process.exit(1);
}

run().catch((e) => {
    console.error("FATAL:", e);
    process.exit(1);
});
