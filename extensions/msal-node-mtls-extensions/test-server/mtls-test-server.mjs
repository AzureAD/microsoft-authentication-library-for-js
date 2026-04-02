/**
 * mtls-test-server.mjs
 *
 * A minimal required-mTLS HTTPS server used to validate the makeMtlsMsiRequest
 * end-to-end flow during manual testing on an Azure VM.
 *
 * The server requires a client certificate (requestCert: true) and validates that
 * the SHA-256 thumbprint of the presented client cert matches the cnf.x5t#S256
 * claim embedded in the mtls_pop access token, exactly as a real mtls_pop-aware
 * resource server would.
 *
 * Usage:
 *   node mtls-test-server.mjs
 *
 * Then in another terminal run the manual test script (see Step 7 of
 * lib/msal-node/docs/mtls-pop-manual-testing.md).
 */

import https from "node:https";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 8443;

const server = https.createServer(
    {
        key: fs.readFileSync(path.join(__dirname, "server.key")),
        cert: fs.readFileSync(path.join(__dirname, "server.crt")),
        // Require a client certificate — this is what makes this a "required mTLS" server.
        // Without this, the TLS handshake never sends CertificateRequest and the client
        // cert is never transmitted.
        requestCert: true,
        rejectUnauthorized: false, // We do our own validation below
    },
    (req, res) => {
        const peerCert = req.socket.getPeerCertificate();

        // No client certificate presented
        if (!peerCert || !peerCert.raw) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    error: "MtlsMissingClientCertificate",
                    error_description:
                        "No client certificate was presented in the TLS handshake.",
                })
            );
            return;
        }

        // Compute SHA-256 thumbprint of the client cert (matches cnf.x5t#S256 format)
        const certDer = peerCert.raw;
        const sha256 = createHash("sha256").update(certDer).digest("base64url");

        // Extract the Authorization header: "mtls_pop <token>"
        const authHeader = req.headers["authorization"] || "";
        const tokenMatch = authHeader.match(/^mtls_pop\s+(.+)$/i);
        if (!tokenMatch) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    error: "MissingAuthorization",
                    error_description:
                        'Expected "Authorization: mtls_pop <token>" header.',
                })
            );
            return;
        }

        // Decode the JWT payload (no signature verification — this is a test server)
        const token = tokenMatch[1];
        let cnfThumbprint = null;
        try {
            const payloadB64 = token.split(".")[1];
            const payload = JSON.parse(
                Buffer.from(payloadB64, "base64url").toString("utf8")
            );
            cnfThumbprint = payload?.cnf?.["x5t#S256"];
        } catch {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    error: "MalformedToken",
                    error_description: "Could not decode the JWT payload.",
                })
            );
            return;
        }

        // Validate thumbprint binding
        if (!cnfThumbprint || cnfThumbprint !== sha256) {
            res.writeHead(401, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    error: "MtlsCertificateMismatch",
                    error_description: `Token cnf.x5t#S256 (${cnfThumbprint}) does not match presented client cert thumbprint (${sha256}).`,
                })
            );
            return;
        }

        // Success — thumbprint matches
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({
                message: "mTLS PoP validation successful",
                clientCertThumbprint: sha256,
                subject: peerCert.subject,
                issuer: peerCert.issuer,
            })
        );
    }
);

server.listen(PORT, "127.0.0.1", () => {
    console.log(`✅ Required-mTLS test server listening on https://127.0.0.1:${PORT}`);
    console.log(
        "   Client must present a certificate whose SHA-256 thumbprint matches cnf.x5t#S256 in the token."
    );
    console.log("   Press Ctrl+C to stop.");
});
