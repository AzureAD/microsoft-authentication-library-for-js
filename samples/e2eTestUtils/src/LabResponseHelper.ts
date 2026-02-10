/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    getMsidLabKeyVaultProvider,
    getMsalTeamKeyVaultProvider,
} from "./KeyVaultSecretsProvider";
import { UserConfig, LabUser } from "./UserConfig";
import { AppConfig } from "./AppConfig";

/**
 * Caches for configuration objects retrieved from Key Vault.
 * Using Map for in-memory caching to avoid repeated Key Vault calls.
 */
const userConfigCache = new Map<string, UserConfig>();
const appConfigCache = new Map<string, AppConfig>();
const passwordCache = new Map<string, string>();

/**
 * Helper class for retrieving lab configuration from Azure Key Vault.
 * Provides methods to fetch user configs, app configs, and passwords with caching.
 */
export class LabResponseHelper {
    /**
     * Retrieves user configuration from Key Vault with caching.
     * @param secretName - The name of the Key Vault secret containing user configuration JSON.
     * @returns A UserConfig object deserialized from the Key Vault secret.
     */
    static async getUserConfig(secretName: string): Promise<UserConfig> {
        // Check cache first
        const cached = userConfigCache.get(secretName);
        if (cached) {
            console.debug(`UserConfig '${secretName}' retrieved from cache`);
            return cached;
        }

        try {
            const keyVaultProvider = getMsalTeamKeyVaultProvider();
            const secretValue = await keyVaultProvider.getSecretValue(
                secretName
            );

            if (!secretValue) {
                throw new Error(`KeyVault secret '${secretName}' is empty`);
            }

            let userConfig: UserConfig;
            try {
                // Parse as JSON and extract the 'user' property
                const jsonObject = JSON.parse(secretValue);

                // Look for 'user' property (case-insensitive)
                const userKey = Object.keys(jsonObject).find(
                    (key) => key.toLowerCase() === "user"
                );

                if (!userKey) {
                    throw new Error(
                        `KeyVault '${secretName}': no 'user' property found in JSON`
                    );
                }

                userConfig = jsonObject[userKey] as UserConfig;
                console.debug(
                    `KeyVault '${secretName}': ${
                        userConfig.upn ?? "Unknown user"
                    }`
                );
            } catch (parseError) {
                if (parseError instanceof SyntaxError) {
                    throw new Error(
                        `KeyVault '${secretName}': invalid JSON - ${parseError.message}`
                    );
                }
                throw parseError;
            }

            // Cache the result
            userConfigCache.set(secretName, userConfig);
            return userConfig;
        } catch (error) {
            console.error(`KeyVault '${secretName}' failed:`, error);
            throw new Error(
                `Failed to retrieve or parse Key Vault secret '${secretName}'. ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }

    /**
     * Retrieves user configuration as a LabUser instance with password retrieval capability.
     * @param secretName - The name of the Key Vault secret containing user configuration JSON.
     * @returns A LabUser object with password retrieval capability.
     */
    static async getLabUser(secretName: string): Promise<LabUser> {
        const config = await this.getUserConfig(secretName);
        return new LabUser(config);
    }

    /**
     * Retrieves app configuration from Key Vault with caching.
     * @param secretName - The name of the Key Vault secret containing app configuration JSON.
     * @returns An AppConfig object deserialized from the Key Vault secret.
     */
    static async getAppConfig(secretName: string): Promise<AppConfig> {
        // Check cache first
        const cached = appConfigCache.get(secretName);
        if (cached) {
            console.debug(`AppConfig '${secretName}' retrieved from cache`);
            return cached;
        }

        try {
            const keyVaultProvider = getMsalTeamKeyVaultProvider();
            const secretValue = await keyVaultProvider.getSecretValue(
                secretName
            );

            if (!secretValue) {
                throw new Error(`KeyVault secret '${secretName}' is empty`);
            }

            let appConfig: AppConfig;
            try {
                // Parse as JSON and extract the 'app' property
                const jsonObject = JSON.parse(secretValue);

                // Look for 'app' property (case-insensitive)
                const appKey = Object.keys(jsonObject).find(
                    (key) => key.toLowerCase() === "app"
                );

                if (!appKey) {
                    throw new Error(
                        `KeyVault '${secretName}': no 'app' property found in JSON`
                    );
                }

                appConfig = jsonObject[appKey] as AppConfig;
                console.debug(
                    `KeyVault '${secretName}': ${
                        appConfig.appId ?? "Unknown app"
                    }`
                );
            } catch (parseError) {
                if (parseError instanceof SyntaxError) {
                    throw new Error(
                        `KeyVault '${secretName}': invalid JSON - ${parseError.message}`
                    );
                }
                throw parseError;
            }

            // Cache the result
            appConfigCache.set(secretName, appConfig);
            return appConfig;
        } catch (error) {
            console.error(`KeyVault '${secretName}' failed:`, error);
            throw new Error(
                `Failed to retrieve or parse Key Vault secret '${secretName}'. ${
                    error instanceof Error ? error.message : String(error)
                }`
            );
        }
    }

    /**
     * Fetches user password from the MSID Lab Key Vault.
     * Used internally by LabUser.getPassword().
     * @param userLabName - The lab name that serves as the secret name for the password.
     * @returns The user's password.
     */
    static async fetchUserPassword(userLabName: string): Promise<string> {
        if (!userLabName || userLabName.trim() === "") {
            throw new Error(
                "Password fetch failed: lab name is not set on user."
            );
        }

        // Check cache first
        const cached = passwordCache.get(userLabName);
        if (cached) {
            console.debug(`Password for '${userLabName}' retrieved from cache`);
            return cached;
        }

        const password = await this.getMsidLabSecret(userLabName);

        // Cache the result
        passwordCache.set(userLabName, password);
        console.debug(
            `Password retrieved for ${userLabName} (${password.length} chars)`
        );
        return password;
    }

    /**
     * Retrieves a secret from the MSAL Team Key Vault by name.
     * Use for app secrets and other static configuration.
     * @param secretName - The name of the secret to retrieve.
     * @returns The secret value as a string.
     */
    static async getSecret(secretName: string): Promise<string> {
        if (!secretName || secretName.trim() === "") {
            throw new Error("Secret name cannot be empty.");
        }

        const keyVaultProvider = getMsalTeamKeyVaultProvider();
        const secretValue = await keyVaultProvider.getSecretValue(secretName);

        if (!secretValue) {
            throw new Error(
                `Secret '${secretName}' found but was empty in Key Vault.`
            );
        }

        console.debug(
            `Secret retrieved: ${secretName} (${secretValue.length} chars)`
        );
        return secretValue;
    }

    /**
     * Retrieves a secret from the MSID Lab Key Vault by name.
     * Use for frequently rotated credentials like user passwords.
     * @param secretName - The name of the secret to retrieve.
     * @returns The secret value as a string.
     */
    static async getMsidLabSecret(secretName: string): Promise<string> {
        if (!secretName || secretName.trim() === "") {
            throw new Error("Secret name cannot be empty.");
        }

        const keyVaultProvider = getMsidLabKeyVaultProvider();
        const secretValue = await keyVaultProvider.getSecretValue(secretName);

        if (!secretValue) {
            throw new Error(
                `Secret '${secretName}' found but was empty in Key Vault.`
            );
        }

        console.debug(
            `MSID Lab secret retrieved: ${secretName} (${secretValue.length} chars)`
        );
        return secretValue;
    }

    /**
     * Clears all cached configurations. Useful for testing or forcing fresh data.
     */
    static clearCache(): void {
        userConfigCache.clear();
        appConfigCache.clear();
        passwordCache.clear();
        console.debug("LabResponseHelper cache cleared");
    }
}
