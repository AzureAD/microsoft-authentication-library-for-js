/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Contains names of secrets stored in Azure Key Vault for lab configuration.
 * These secrets contain JSON-serialized configuration objects for users, apps, and lab environments.
 */
export const KeyVaultSecrets = {
    // Names of key vault secrets for user configuration JSONs
    UserPublicCloud: "User-PublicCloud-Config",
    UserFederated: "User-Federated-Config",
    UserPublicCloud2: "MSAL-User-Default2-JSON",

    // Names of key vault secrets for application configuration JSONs
    //  - Broad test scenarios
    AppS2S: "App-S2S-Config",
    AppPCAClient: "App-PCAClient-Config",
    AppWebApi: "App-WebApi-Config",
    AppWebApp: "App-WebApp-Config",
    //  - More specific test scenarios, edge cases, etc.
    MsalAppAzureAdMultipleOrgsRegional: "MSAL-APP-AzureADMultipleOrgsRegional-JSON",

    // Name of key vault secrets for specific test scenarios
    MsalOboSecret: "IdentityDivisionDotNetOBOServiceSecret",
} as const;

export type KeyVaultSecretName =
    (typeof KeyVaultSecrets)[keyof typeof KeyVaultSecrets];
