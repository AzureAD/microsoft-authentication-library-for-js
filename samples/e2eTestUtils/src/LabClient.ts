import { DefaultAzureCredential, TokenCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import {
    ENV_VARIABLES,
    LAB_KEY_VAULT_URL,
    MOBILE_BUILD_VAULT_URL,
    MSAL_TEAM_KEY_VAULT_URL,
    UPN_JSON_SECRET_NAME,
    AppConfigSecrets,
    UserTypes,
    B2cProviders,
} from "./Constants";
import { LabApiQueryParams } from "./LabApiQueryParams";
import { LabConfig } from "./LabConfig";
import * as dotenv from "dotenv";

// Try 1p repo config first
dotenv.config({ path: __dirname + `/../../../../.env` });
// If CLIENT_ID is not set, try the 3p repo for test env config
if (!process.env[ENV_VARIABLES.CLIENT_ID]) {
    dotenv.config({ path: __dirname + `/../../../.env` });
}

// Enable SNI (send certificate chain) for cert-based auth in CI
process.env["AZURE_CLIENT_SEND_CERTIFICATE_CHAIN"] = "true";

/**
 * Represents an entry in the UPN JSON stored in Key Vault.
 */
type UpnJsonEntry = {
    Upn: string;
    HomeTenantId: string;
    KeyVaultEntry: string;
    AzureEnvironment: string;
    CloudUrl: string;
};

/**
 * Cached UPN JSON map (fetched once from Key Vault, reused across all calls).
 */
let cachedUpnJsonMap: Record<string, UpnJsonEntry> | null = null;

/**
 * Cached Key Vault passwords (secret name → password value).
 */
const passwordCache = new Map<string, string>();

/**
 * Cached app configs from MsalTeam KV (secret name → parsed app config).
 */
const appConfigCache = new Map<string, AppConfig>();

/**
 * Represents app configuration retrieved from MsalTeam Key Vault.
 */
type AppConfig = {
    appId?: string;
    redirectUri?: string;
    authority?: string;
    defaultScopes?: string;
    tenantId?: string;
    environment?: string;
    secretName?: string;
};

export class LabClient {
    private credentials: TokenCredential;
    private labKeyVaultClient: SecretClient;
    private mobileBuildKeyVaultClient: SecretClient;
    private msalTeamKeyVaultClient: SecretClient;

    constructor() {
        // Uses DefaultAzureCredential which tries multiple auth methods:
        // - CI: EnvironmentCredential (cert from pipeline)
        // - Local: AzureCliCredential (az login)
        this.credentials = new DefaultAzureCredential();
        this.labKeyVaultClient = new SecretClient(
            LAB_KEY_VAULT_URL,
            this.credentials
        );
        this.mobileBuildKeyVaultClient = new SecretClient(
            MOBILE_BUILD_VAULT_URL,
            this.credentials
        );
        this.msalTeamKeyVaultClient = new SecretClient(
            MSAL_TEAM_KEY_VAULT_URL,
            this.credentials
        );
    }

    /**
     * Fetches and caches the UPN JSON map from Key Vault.
     */
    private async getUpnJsonMap(): Promise<Record<string, UpnJsonEntry>> {
        if (cachedUpnJsonMap) {
            return cachedUpnJsonMap;
        }

        const secret = await this.mobileBuildKeyVaultClient.getSecret(
            UPN_JSON_SECRET_NAME
        );
        if (!secret.value) {
            throw new Error(
                `Key Vault secret '${UPN_JSON_SECRET_NAME}' is empty`
            );
        }

        cachedUpnJsonMap = JSON.parse(secret.value);
        return cachedUpnJsonMap!;
    }

    /**
     * Maps LabApiQueryParams to the corresponding UPN JSON key.
     */
    private mapParamsToUpnKey(labApiParams: LabApiQueryParams): string | null {
        let key: string | null = null;

        if (labApiParams.userType?.toLowerCase() === UserTypes.B2C) {
            if (
                labApiParams.b2cProvider?.toLowerCase() === B2cProviders.LOCAL
            ) {
                key = "B2C-local";
            } else if (
                labApiParams.b2cProvider?.toLowerCase() ===
                B2cProviders.MICROSOFT
            ) {
                key = "B2C-MSA";
            }
        } else if (labApiParams.userType?.toLowerCase() === UserTypes.GUEST) {
            key = "guest";
        } else if (labApiParams.userType?.toLowerCase() === UserTypes.FEDERATED) {
            key = "federated";
        } else if (labApiParams.azureEnvironment || labApiParams.appType) {
            // Default cloud user for standard AAD queries
            key = "basic";
        }

        return key;
    }

    /**
     * Builds a LabConfig-compatible response from a UPN JSON entry.
     */
    private buildLabConfigFromUpnEntry(
        entry: UpnJsonEntry,
        userType: string
    ): LabConfig {
        return {
            user: {
                upn: entry.Upn,
                homeUPN: entry.Upn,
                userType: userType,
                homeTenantID: entry.HomeTenantId,
                tenantID: entry.HomeTenantId,
            },
            app: {},
            lab: {
                labName: entry.KeyVaultEntry,
                azureEnvironment: entry.AzureEnvironment,
                authority: entry.CloudUrl,
                tenantId: entry.HomeTenantId,
            },
        };
    }

    /**
     * Queries for an app environment based on the provided parameters.
     * Uses UPN JSON from Key Vault for user credentials.
     * Uses MsalTeam Key Vault for app-config-only queries (e.g., confidential client config).
     * @param labApiParams
     * @returns
     */
    async getVarsByCloudEnvironment(
        labApiParams: LabApiQueryParams
    ): Promise<any> {
        // For app-config-only queries (no user needed), fetch from MsalTeam Key Vault
        if (this.isAppConfigOnlyQuery(labApiParams)) {
            return await this.getAppConfigFromKeyVault(labApiParams);
        }

        // Use UPN JSON for user credential queries
        const upnKey = this.mapParamsToUpnKey(labApiParams);
        if (!upnKey) {
            throw new Error(
                `Could not map LabApiQueryParams to UPN JSON key: ${JSON.stringify(labApiParams)}`
            );
        }

        const upnJsonMap = await this.getUpnJsonMap();
        const entry = upnJsonMap[upnKey];
        if (!entry) {
            throw new Error(
                `UPN JSON key '${upnKey}' not found in Key Vault secret`
            );
        }

        const labConfig = this.buildLabConfigFromUpnEntry(entry, upnKey);
        return [labConfig];
    }

    /**
     * Determines if a query is app-config-only (no user credentials needed).
     */
    private isAppConfigOnlyQuery(labApiParams: LabApiQueryParams): boolean {
        return (
            !!labApiParams.publicClient ||
            !!labApiParams.signInAudience ||
            !!labApiParams.appPlatform
        );
    }

    /**
     * Fetches app configuration from MsalTeam Key Vault instead of Lab API.
     * Maps query params to the appropriate KV secret name, parses the AppConfig,
     * and optionally fetches the client secret.
     */
    private async getAppConfigFromKeyVault(
        labApiParams: LabApiQueryParams
    ): Promise<any> {
        const secretName = this.mapParamsToAppConfigSecret(labApiParams);
        if (!secretName) {
            throw new Error(
                `Cannot map app-config query params to a Key Vault secret: ${JSON.stringify(labApiParams)}`
            );
        }

        const appConfig = await this.fetchAppConfig(secretName);
        const labConfig = await this.buildLabConfigFromAppConfig(appConfig);
        return [labConfig];
    }

    /**
     * Maps app-config query params to a MsalTeam KV secret name.
     */
    private mapParamsToAppConfigSecret(
        labApiParams: LabApiQueryParams
    ): string | null {
        // Client-credentials / S2S: publicClient=no, signInAudience=azureadmyorg
        if (
            labApiParams.publicClient?.toLowerCase() === "no" &&
            labApiParams.signInAudience?.toLowerCase() === "azureadmyorg"
        ) {
            return AppConfigSecrets.S2S;
        }

        // Public client app config
        if (labApiParams.publicClient?.toLowerCase() === "yes") {
            return AppConfigSecrets.PCAClient;
        }

        // Web platform apps
        if (labApiParams.appPlatform?.toLowerCase() === "web") {
            return AppConfigSecrets.WebApp;
        }

        return null;
    }

    /**
     * Fetches and caches an AppConfig from MsalTeam Key Vault.
     */
    private async fetchAppConfig(secretName: string): Promise<AppConfig> {
        const cached = appConfigCache.get(secretName);
        if (cached) {
            return cached;
        }

        const secret =
            await this.msalTeamKeyVaultClient.getSecret(secretName);
        if (!secret.value) {
            throw new Error(
                `MsalTeam KV secret '${secretName}' is empty`
            );
        }

        const jsonObject = JSON.parse(secret.value);
        const appKey = Object.keys(jsonObject).find(
            (key) => key.toLowerCase() === "app"
        );

        if (!appKey) {
            throw new Error(
                `MsalTeam KV secret '${secretName}': no 'app' property found in JSON`
            );
        }

        const appConfig = jsonObject[appKey] as AppConfig;
        appConfigCache.set(secretName, appConfig);
        return appConfig;
    }

    /**
     * Builds a LabConfig from an AppConfig retrieved from Key Vault.
     * Pre-fetches the client secret if available.
     */
    private async buildLabConfigFromAppConfig(
        appConfig: AppConfig
    ): Promise<LabConfig> {
        // Parse authority into base URL and tenant ID
        let authorityBase = "https://login.microsoftonline.com/";
        let tenantId = appConfig.tenantId || "";

        if (appConfig.authority) {
            try {
                const url = new URL(appConfig.authority);
                authorityBase = `${url.protocol}//${url.host}/`;
                const pathTenant = url.pathname.replace(/^\//, "").replace(/\/$/, "");
                if (pathTenant && !tenantId) {
                    tenantId = pathTenant;
                }
            } catch {
                authorityBase = appConfig.authority;
            }
        }

        // Pre-fetch client secret from MsalTeam KV if secretName is specified
        let clientSecret: string | undefined;
        if (appConfig.secretName) {
            try {
                const secretResult =
                    await this.msalTeamKeyVaultClient.getSecret(
                        appConfig.secretName
                    );
                clientSecret = secretResult.value || undefined;
            } catch (e) {
                console.warn(
                    `Failed to fetch client secret '${appConfig.secretName}' from MsalTeam KV: ${e}`
                );
            }
        }

        return {
            user: {},
            app: {
                appId: appConfig.appId,
                appName: appConfig.secretName,
                defaultScopes: appConfig.defaultScopes,
                clientSecret: clientSecret,
            },
            lab: {
                authority: authorityBase,
                tenantId: tenantId,
                azureEnvironment: appConfig.environment,
            },
        };
    }

    /**
     * Retrieves a secret (typically a password) directly from Key Vault.
     * @param secretName - The name of the secret in Key Vault (e.g., "ID4SLab2", "MSIDLABB2C").
     */
    async getSecret(secretName: string): Promise<any> {
        // Check password cache
        const cached = passwordCache.get(secretName);
        if (cached) {
            return { value: cached };
        }

        const secret =
            await this.labKeyVaultClient.getSecret(secretName);
        if (!secret.value) {
            throw new Error(
                `Key Vault secret '${secretName}' is empty`
            );
        }

        passwordCache.set(secretName, secret.value);
        return { value: secret.value };
    }
}
