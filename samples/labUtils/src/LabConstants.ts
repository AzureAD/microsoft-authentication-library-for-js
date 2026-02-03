/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

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
export const EnvVariables = {
    TENANT: "AZURE_TENANT_ID",
    CLIENT_ID: "AZURE_CLIENT_ID",
    CERTIFICATE_PATH: "AZURE_CLIENT_CERTIFICATE_PATH",
} as const;
