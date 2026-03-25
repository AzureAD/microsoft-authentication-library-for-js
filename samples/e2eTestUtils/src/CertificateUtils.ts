/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const { X509Certificate, createPrivateKey } = require("crypto");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

import { TokenCredential } from "@azure/identity";
import { CertificateClient } from "@azure/keyvault-certificates";
import { SecretClient } from "@azure/keyvault-secrets";

// define path for temporary PKCS#12 file
const p12FilePath = path.join(__dirname, "certificate.p12");

/**
 * Retrieves the newest active certificate from Azure Key Vault by name.
 *
 * Uses the Certificates API to always fetch the latest enabled version of the
 * certificate and computes the SHA-256 thumbprint directly from it. The
 * corresponding PKCS#12 bundle is then fetched from the Secrets API to extract
 * the private key and certificate chain (x5c).
 *
 * This eliminates any dependency on hardcoded thumbprints — when a certificate
 * is rotated in Key Vault, the newest version is automatically picked up.
 *
 * @async
 * @param {TokenCredential} credentials - Azure credential used to access Key Vault.
 * @param {string} keyVaultUrl - The URL of the Key Vault (e.g. "https://msidlabs.vault.azure.net").
 * @param {string} certName - The name of the certificate in Key Vault.
 *
 * @returns {Promise<Array<string>>} A promise that resolves to an array containing:
 *  - The thumbprint (SHA-256 hash) of the newest certificate.
 *  - The private key extracted from the PKCS#12 certificate.
 *  - The full certificate chain (x5c) in PEM format, including all certificates.
 *
 * @throws {Error} If the certificate cannot be retrieved or parsed.
 */
export const getCertificateInfo = async (
    credentials: TokenCredential,
    keyVaultUrl: string,
    certName: string
): Promise<Array<string>> => {
    // Use CertificateClient to fetch the latest active certificate version
    const certClient = new CertificateClient(keyVaultUrl, credentials);
    const cert = await certClient.getCertificate(certName);

    if (!cert.cer) {
        throw `Certificate '${certName}' has no CER data in Key Vault`;
    }

    // Compute SHA-256 thumbprint from the certificate's DER data
    const base64Cert = Buffer.from(cert.cer).toString("base64");
    const pemLines = base64Cert.match(/.{1,64}/g)?.join("\n") || base64Cert;
    const certPem = `-----BEGIN CERTIFICATE-----\n${pemLines}\n-----END CERTIFICATE-----`;
    const leafX509 = new X509Certificate(certPem);
    const thumbprint: string = leafX509.fingerprint256.replaceAll(":", "");

    // Fetch the PKCS#12 bundle from the corresponding secret
    const secretClient = new SecretClient(keyVaultUrl, credentials);
    const secret = await secretClient.getSecret(certName);

    if (!secret.value) {
        throw `Secret for certificate '${certName}' is empty in Key Vault`;
    }

    const pkcs12Certificate = Buffer.from(secret.value, "base64");
    // write the PKCS#12 certificate to a temporary file
    fs.writeFileSync(p12FilePath, pkcs12Certificate);

    try {
        // Extract private key from the PKCS#12 bundle
        const keyOutput: string = execSync(
            `openssl pkcs12 -in "${p12FilePath}" -nocerts -nodes -passin pass:`,
            { encoding: "utf-8" }
        );
        const privateKeyMatch = keyOutput.match(
            /-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/
        );
        if (!privateKeyMatch) {
            throw "Could not extract private key from PKCS#12";
        }
        const privateKey = privateKeyMatch[0] + "\n";
        const privateKeyObject = createPrivateKey(privateKey);

        // Extract certificate chain from the PKCS#12 bundle
        const certOutput: string = execSync(
            `openssl pkcs12 -in "${p12FilePath}" -nokeys -nodes -passin pass:`,
            { encoding: "utf-8" }
        );
        const certMatches = certOutput.match(
            /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g
        );
        if (!certMatches || certMatches.length === 0) {
            throw "Could not extract certificates from PKCS#12";
        }
        let certificates = certMatches.map((c: string) => c + "\n");
        let x5c = certificates.join("");

        // Ensure the certificate chain is in the correct order (leaf cert first)
        const x509FromFirstCertificate = new X509Certificate(certificates[0]);

        // check if the private key matches the first certificate in the x5c
        if (!x509FromFirstCertificate.checkPrivateKey(privateKeyObject)) {
            const x509FromLastCertificate = new X509Certificate(
                certificates[certificates.length - 1]
            );

            // if it doesn't match, the x5c may be reversed (this is common when exporting certificates from azure key vault)
            // check if the private key matches the last certificate in the x5c
            if (x509FromLastCertificate.checkPrivateKey(privateKeyObject)) {
                // if it does, reverse the certs in the x5c
                x5c = certificates.reverse().join("");
            } else {
                // if it doesn't match, the certificate is malformed
                throw "Certificate is malformed";
            }
        }

        return [thumbprint, privateKey, x5c];
    } catch (error) {
        throw `Error processing PKCS#12 file: ${error}`;
    } finally {
        // clean up temporary files
        try {
            fs.unlinkSync(p12FilePath);
        } catch {
            // ignore cleanup errors
        }
    }
};
