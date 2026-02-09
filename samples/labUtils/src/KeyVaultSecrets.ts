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
    UserB2C: "MSAL-USER-B2C-JSON",
    UserArlington: "MSAL-USER-Arlington-JSON",
    UserCiam: "MSAL-USER-CIAM-JSON",
    UserPop: "MSAL-User-POP-JSON",

    // Names of key vault secrets for application configuration JSONs
    //  - Broad test scenarios
    AppS2S: "App-S2S-Config",
    AppPCAClient: "App-PCAClient-Config",
    AppWebApi: "App-WebApi-Config",
    AppWebApp: "App-WebApp-Config",
    //  - More specific test scenarios, edge cases, etc.
    B2CAppIdLabsAppB2C: "MSAL-App-B2C-JSON",
    ArlAppIdLabsApp: "MSAL-App-Arlington-JSON",
    MsalAppCiam: "MSAL-App-CIAM-JSON",
    MsalAppAzureAdMultipleOrgsRegional:
        "MSAL-APP-AzureADMultipleOrgsRegional-JSON",
    MsalAppArlingtonCCA: "MSAL-App-ArlingtonCCA-JSON",

    // Name of key vault secrets for specific test scenarios
    MsalOboSecret: "IdentityDivisionDotNetOBOServiceSecret",

    // Name of key vault secrets for app secrets and certificates
    DefaultAppSecret: "MSAL-App-Default",
} as const;

export type KeyVaultSecretName =
    (typeof KeyVaultSecrets)[keyof typeof KeyVaultSecrets];
