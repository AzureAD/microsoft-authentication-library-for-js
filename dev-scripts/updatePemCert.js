/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const path = require("path");
const fs = require("fs");

const pemPath = process.argv[2];
const pemCert = fs.readFileSync(pemPath, "utf8");

const END_PRIVATE_KEY = "-----END PRIVATE KEY-----";
const END_CERTIFICATE = "-----END CERTIFICATE-----";

// Separate the private key from the x5c certificate chain
const [privateKey, certs] = pemCert.split(END_PRIVATE_KEY);
const x5cCerts = reorderCerts(certs);
const processedPem = `${privateKey}${END_PRIVATE_KEY}${x5cCerts}${END_CERTIFICATE}`;

fs.writeFileSync(pemPath, processedPem, "utf8");

/**
 * Moves the leaf certificate to the front of the chain
 * @param {*} certs Serialized x5c certificate chain
 */
function reorderCerts(certs) {
    // Split the certs into an array
    const x5cCerts = certs.split(END_CERTIFICATE);
    // Remove the last element which is an empty string
    x5cCerts.pop();
    // Move the leaf certificate to the front of the chain
    x5cCerts.unshift(x5cCerts.pop());
    // Rejoin into a serialized cert chain
    return x5cCerts.join(END_CERTIFICATE);
}