/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const { X509Certificate, createPrivateKey } = require("crypto");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

import { getKeyVaultSecret } from "./KeyVaultUtils";

// define paths for temporary files
const p12FilePath = path.join(__dirname, "certificate.p12");
const certificateKEY = path.join(__dirname, "certificate.key");
const certificateCER = path.join(__dirname, "certificate.cer");

/**
 * Retrieves certificate information from Azure Key Vault, extracts the private key and certificate(s),
 * and verifies the private key with the certificate chain to ensure proper matching.
 *
 * This function handles the extraction of a PKCS#12 certificate stored as a secret in Azure Key Vault,
 * splits it into the private key and certificate(s), and validates the match between the private key
 * and the certificates. It also ensures the correct order of certificates in the chain (if necessary).
 *
 * **Note:** The function writes temporary files to the local filesystem and cleans them up after the process is complete.
 * 
 * @async
 * @param {any} client - The Azure Key Vault client object used to interact with the Key Vault.
 * @param {string} secretName - The name of the secret in Key Vault that contains the base64-encoded PKCS#12 certificate.
 * 
 * @returns {Promise<Array<string>>} A promise that resolves to an array containing:
 *  - The thumbprint (SHA-256 hash) of the certificate in the correct order.
 *  - The private key extracted from the PKCS#12 certificate.
 *  - The full certificate chain (x5c) in PEM format, including all certificates.
 * 
 * @throws {Error} If an error occurs while processing the PKCS#12 certificate, such as a malformed certificate or mismatched private key.
 * @throws {Error} If the private key does not match any of the certificates in the chain.
 */
export const getCertificateInfo = async (
    client: any,
    secretName: string
): Promise<Array<string>> => {
    const PKCS12CertificateBase64: string = await getKeyVaultSecret(
        client,
        secretName
    );

    // get the private key and the public certificate, in PKCS 12 format
    const pkcs12Certificate = Buffer.from(PKCS12CertificateBase64, "base64");

    // write the PKCS#12 certificate to a temporary file
    fs.writeFileSync(p12FilePath, pkcs12Certificate);

    try {
        // get the private key from the pkcs12 file through openssl, via a synchronous child process
        execSync(
            `openssl pkcs12 -in ${p12FilePath} -nocerts -nodes -passin pass: | sed -ne '/-BEGIN PRIVATE KEY-/,/-END PRIVATE KEY-/p' > ${certificateKEY}`
        );
        const privateKey: string = fs.readFileSync(certificateKEY, "utf-8");
        // this will be used to check if the private key matches the x5c, which ensures the x5c is in the correct order
        const privateKeyObject = createPrivateKey(privateKey);

        // get the x5c from the pkcs12 file through openssl, via a synchronous child process
        execSync(
            `openssl pkcs12 -in ${p12FilePath} -nokeys -nodes -passin pass: | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' > ${certificateCER}`
        );
        let x5c: string = fs.readFileSync(certificateCER, "utf-8");

        // get a string list of the certificates from the x5c, where the strings will include -----BEGIN CERTIFICATE----- and -----END CERTIFICATE-----
        const certificates = x5c.split(/(?=-----BEGIN CERTIFICATE-----\n)/g);

        const x509FromFirstCertificate = new X509Certificate(certificates[0]);

        // check if the private key matches the first certificate in the x5c
        let thumbprint: string = "";
        if (!x509FromFirstCertificate.checkPrivateKey(privateKeyObject)) {
            const x509FromLastCertificate = new X509Certificate(
                certificates[certificates.length - 1]
            );

            // if it doesn't match, the x5c may be reversed (this is common when exporting certificates from azure key vault)
            // check if the private key matches the last certificate in the x5c
            if (x509FromLastCertificate.checkPrivateKey(privateKeyObject)) {
                // if it does, reverse the certs in the x5c
                x5c = certificates.reverse().join("");
                // format the thumbprint // A:B:C -> ABC
                thumbprint = x509FromLastCertificate.fingerprint256.replaceAll(
                    ":",
                    ""
                );
            } else {
                // if it doesn't match, the certificate is malformed
                throw "Certificate is malformed";
            }
        } else {
            // format the thumbprint // A:B:C -> ABC
            thumbprint = x509FromFirstCertificate.fingerprint256.replaceAll(
                ":",
                ""
            );
        }

        return [thumbprint, privateKey, x5c];
    } catch (error) {
        throw `Error processing PKCS#12 file: ${error}`;
    } finally {
        // clean up temporary files
        fs.unlinkSync(p12FilePath);
        fs.unlinkSync(certificateKEY);
        fs.unlinkSync(certificateCER);
    }
};
