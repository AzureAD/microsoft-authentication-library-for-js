/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

/**
 * Represents application configuration retrieved from Key Vault.
 * This maps to the 'app' property in Key Vault secret JSON.
 */
export type AppConfig = {
    /** The application (client) ID registered in Azure AD */
    appId?: string;

    /** The redirect URI configured for the application */
    redirectUri?: string;

    /** The authority URL (e.g., "https://login.microsoftonline.com/{tenantId}") */
    authority?: string;

    /** The default scopes for the application (space-separated) */
    defaultScopes?: string;

    /** The tenant ID where the application is registered */
    tenantId?: string;

    /** The Azure environment (e.g., "azurecloud", "azureusgovernment") */
    environment?: string;

    /** The name of the Key Vault secret containing the app's client secret */
    secretName?: string;
};
