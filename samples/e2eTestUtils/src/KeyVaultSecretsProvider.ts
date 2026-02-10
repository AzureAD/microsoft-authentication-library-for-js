/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { SecretClient, KeyVaultSecret } from "@azure/keyvault-secrets";
import { ClientCertificateCredential } from "@azure/identity";
import * as fs from "fs";
import * as crypto from "crypto";
import * as dotenv from "dotenv";

// Load environment variables from .env file
// Try 1p repo config first
dotenv.config({ path: __dirname + `/../../../../.env` });
// If CLIENT_ID is not set, try the 3p repo for test env config
if (!process.env["AZURE_CLIENT_ID"]) {
    dotenv.config({ path: __dirname + `/../../../.env` });
}

/**
 * Key Vault URLs for lab infrastructure.
 */
export const KeyVaultInstance = {
    /**
     * This Key Vault is generally used for frequently rotated credentials (e.g., user passwords).
     */
    MSIDLab: "https://msidlabs.vault.azure.net",

    /**
     * This Key Vault is generally used for static configuration (user/app configs, app secrets).
     */
    MsalTeam: "https://id4skeyvault.vault.azure.net",
} as const;

/**
 * Environment variable names for lab authentication.
 */
const EnvVariables = {
    TENANT: "AZURE_TENANT_ID",
    CLIENT_ID: "AZURE_CLIENT_ID",
    CERTIFICATE_PATH: "AZURE_CLIENT_CERTIFICATE_PATH",
} as const;

/**
 * Certificate credential information that can be used for MSAL ConfidentialClientApplication.
 */
export type LabCertificateCredential = {
    /** The client ID of the lab authentication app */
    clientId: string;
    /** The tenant ID for lab authentication */
    tenantId: string;
    /** The SHA-256 thumbprint of the certificate */
    thumbprintSha256: string;
    /** The private key in PEM format */
    privateKey: string;
    /** The certificate chain (x5c) in PEM format */
    x5c: string;
};

/** Cached lab credential (extracted once, reused across all tests) */
let cachedLabCredential: LabCertificateCredential | null = null;

/** Cached ClientCertificateCredential for Key Vault access */
let cachedKeyVaultCredential: ClientCertificateCredential | null = null;

/**
 * Extracts certificate information from a PEM file containing both certificate and private key.
 * @param pemContent - The PEM content as a string
 * @returns Certificate credential information (thumbprint, privateKey, x5c)
 */
function extractCertificateInfoFromPem(pemContent: string): {
    thumbprintSha256: string;
    privateKey: string;
    x5c: string;
} {
    // Extract private key (supports both PKCS#8 and PKCS#1 formats)
    const privateKeyMatch = pemContent.match(
        /-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/
    );
    const rsaPrivateKeyMatch = pemContent.match(
        /-----BEGIN RSA PRIVATE KEY-----[\s\S]*?-----END RSA PRIVATE KEY-----/
    );
    const privateKey = privateKeyMatch?.[0] || rsaPrivateKeyMatch?.[0];

    if (!privateKey) {
        throw new Error("No private key found in PEM content");
    }

    // Extract all certificates (there may be a chain)
    const certMatches = pemContent.match(
        /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g
    );

    if (!certMatches || certMatches.length === 0) {
        throw new Error("No certificate found in PEM content");
    }

    // The first certificate should be the leaf certificate
    const leafCert = certMatches[0];
    const x5c = certMatches.join("\n");

    // Calculate SHA-256 thumbprint from the leaf certificate
    const certDer = Buffer.from(
        leafCert
            .replace(/-----BEGIN CERTIFICATE-----/g, "")
            .replace(/-----END CERTIFICATE-----/g, "")
            .replace(/\s/g, ""),
        "base64"
    );
    const thumbprintSha256 = crypto
        .createHash("sha256")
        .update(certDer)
        .digest("hex")
        .toUpperCase();

    return {
        thumbprintSha256,
        privateKey,
        x5c,
    };
}

/**
 * Gets the ClientCertificateCredential for authenticating with Azure Key Vault.
 * Uses the certificate path from environment variables (expects PEM format).
 * This follows the same pattern as LabClient.
 *
 * @returns ClientCertificateCredential for Key Vault access
 * @throws Error if required environment variables are not set
 */
function getKeyVaultCredential(): ClientCertificateCredential {
    if (cachedKeyVaultCredential) {
        return cachedKeyVaultCredential;
    }

    const tenant = process.env[EnvVariables.TENANT];
    const clientId = process.env[EnvVariables.CLIENT_ID];
    const certPath = process.env[EnvVariables.CERTIFICATE_PATH];

    if (!tenant || !clientId || !certPath) {
        throw new Error(
            `Environment variables not set! Required: ${EnvVariables.TENANT}, ${EnvVariables.CLIENT_ID}, ${EnvVariables.CERTIFICATE_PATH}`
        );
    }

    if (!fs.existsSync(certPath)) {
        throw new Error(`Certificate file not found at ${certPath}`);
    }

    cachedKeyVaultCredential = new ClientCertificateCredential(
        tenant,
        clientId,
        certPath,
        {
            sendCertificateChain: true,
        }
    );

    return cachedKeyVaultCredential;
}

/**
 * Provides access to Azure Key Vault secrets using certificate-based authentication.
 * This class manages connections to Key Vault and provides methods to retrieve secrets.
 *
 * Authentication uses ClientCertificateCredential with a PEM certificate file,
 * following the same pattern as LabClient in e2eTestUtils.
 */
export class KeyVaultSecretsProvider {
    private secretClient: SecretClient;
    private keyVaultAddress: string;

    /**
     * Creates a new KeyVaultSecretsProvider instance.
     * @param keyVaultAddress - The URL of the Key Vault (defaults to MSIDLab Key Vault)
     */
    constructor(keyVaultAddress: string = KeyVaultInstance.MSIDLab) {
        this.keyVaultAddress = keyVaultAddress;
        const credential = getKeyVaultCredential();
        this.secretClient = new SecretClient(keyVaultAddress, credential);
    }

    /**
     * Gets the Key Vault address this provider is connected to.
     */
    getKeyVaultAddress(): string {
        return this.keyVaultAddress;
    }

    /**
     * Retrieves a secret from Key Vault by name.
     * @param secretName - The name of the secret to retrieve
     * @returns The Key Vault secret
     */
    async getSecretByName(secretName: string): Promise<KeyVaultSecret> {
        return await this.secretClient.getSecret(secretName);
    }

    /**
     * Retrieves a secret from Key Vault by name and version.
     * @param secretName - The name of the secret to retrieve
     * @param secretVersion - The specific version of the secret
     * @returns The Key Vault secret
     */
    async getSecretByNameAndVersion(
        secretName: string,
        secretVersion: string
    ): Promise<KeyVaultSecret> {
        return await this.secretClient.getSecret(secretName, {
            version: secretVersion,
        });
    }

    /**
     * Retrieves the value of a secret from Key Vault.
     * @param secretName - The name of the secret to retrieve
     * @returns The secret value as a string
     * @throws Error if the secret is not found or has no value
     */
    async getSecretValue(secretName: string): Promise<string> {
        const secret = await this.getSecretByName(secretName);
        if (!secret.value) {
            throw new Error(`Secret '${secretName}' found but has no value`);
        }
        return secret.value;
    }
}

/**
 * Singleton instances of KeyVaultSecretsProvider for each Key Vault.
 * These are lazily initialized on first access.
 */
let msidLabProvider: KeyVaultSecretsProvider | null = null;
let msalTeamProvider: KeyVaultSecretsProvider | null = null;

/**
 * Gets a KeyVaultSecretsProvider instance for the MSID Lab Key Vault.
 * This Key Vault is used for frequently rotated credentials and sensitive configuration.
 */
export function getMsidLabKeyVaultProvider(): KeyVaultSecretsProvider {
    if (!msidLabProvider) {
        msidLabProvider = new KeyVaultSecretsProvider(KeyVaultInstance.MSIDLab);
    }
    return msidLabProvider;
}

/**
 * Gets a KeyVaultSecretsProvider instance for the MSAL Team Key Vault.
 * This Key Vault is used for static user/app configuration.
 */
export function getMsalTeamKeyVaultProvider(): KeyVaultSecretsProvider {
    if (!msalTeamProvider) {
        msalTeamProvider = new KeyVaultSecretsProvider(
            KeyVaultInstance.MsalTeam
        );
    }
    return msalTeamProvider;
}

/**
 * Gets the lab certificate credential for use in tests.
 * This credential can be used to create ConfidentialClientApplication instances.
 *
 * Reads the PEM certificate from the path specified in the AZURE_CLIENT_CERTIFICATE_PATH
 * environment variable and extracts the thumbprint, private key, and certificate chain.
 *
 * The result is cached for subsequent calls.
 *
 * @returns Certificate credential with clientId, tenantId, thumbprintSha256, privateKey, and x5c
 * @throws Error if required environment variables are not set or certificate file not found
 */
export function getLabCredential(): LabCertificateCredential {
    // Return cached credential if available
    if (cachedLabCredential) {
        return cachedLabCredential;
    }

    const tenant = process.env[EnvVariables.TENANT];
    const clientId = process.env[EnvVariables.CLIENT_ID];
    const certPath = process.env[EnvVariables.CERTIFICATE_PATH];

    if (!tenant || !clientId || !certPath) {
        throw new Error(
            `Environment variables not set! Required: ${EnvVariables.TENANT}, ${EnvVariables.CLIENT_ID}, ${EnvVariables.CERTIFICATE_PATH}`
        );
    }

    if (!fs.existsSync(certPath)) {
        throw new Error(`Certificate file not found at ${certPath}`);
    }

    const pemContent = fs.readFileSync(certPath, "utf-8");
    const certInfo = extractCertificateInfoFromPem(pemContent);

    cachedLabCredential = {
        clientId,
        tenantId: tenant,
        thumbprintSha256: certInfo.thumbprintSha256,
        privateKey: certInfo.privateKey,
        x5c: certInfo.x5c,
    };

    return cachedLabCredential;
}

/**
 * Clears the cached credentials.
 * Useful for testing or when you need to force a refresh.
 */
export function clearLabCredentialCache(): void {
    cachedLabCredential = null;
    cachedKeyVaultCredential = null;
}
