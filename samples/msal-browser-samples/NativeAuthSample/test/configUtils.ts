/**
 * Test configuration for Native Auth Sample E2E tests
 * Contains tenant information, proxy settings, timeouts, and test user data
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Default test configuration
 * Update these values based on your test environment
 */
export const testConfig = {
    tenant: {
        name: "MSIDLABCIAM6",
        id: "fe362aec-5d43-45d1-b730-9755e60dc3b9",
        labKeyVaultName: "MSIDLABCIAM6"
    },
    
    proxy: {
        port: 30001,
        enabled: true
    },
    
    timeouts: {
        standard: 45000,  // 45 seconds
        auth: 60000,      // 60 seconds
        test: 120000      // 120 seconds
    },
    
    screenshots: {
        enabled: true,
        baseFolderName: "./screenshots"
    }
};


/**
 * Utility functions
 */
export const getTenantInfo = () => ({
    name: testConfig.tenant.name,
    id: testConfig.tenant.id
});

export const getProxyPort = () => testConfig.proxy.port;

export const getLabKeyVaultName = () => testConfig.tenant.labKeyVaultName;

/**
 * Constants for nativeAuthConfig.json keys
 * These represent the existing keys in the configuration file
 */
export const NATIVE_AUTH_CONFIG_KEYS = {
    // Root level
    NATIVE_AUTH: 'native_auth',
    
    // Native auth configuration keys
    EMAIL_PASSWORD_CLIENT_ID: 'native_auth.email_password_client_id',
    EMAIL_CODE_CLIENT_ID: 'native_auth.email_code_client_id',
    EMAIL_PASSWORD_ATTRIBUTES_CLIENT_ID: 'native_auth.email_password_attributes_client_id',
    EMAIL_CODE_ATTRIBUTES_CLIENT_ID: 'native_auth.email_code_attributes_client_id',
    TENANT_SUBDOMAIN: 'native_auth.tenant_subdomain',
    TENANT_ID: 'native_auth.tenant_id',
    SIGN_IN_EMAIL_PASSWORD_USERNAME: 'native_auth.sign_in_email_password_username',
    SIGN_IN_EMAIL_CODE_USERNAME: 'native_auth.sign_in_email_code_username',
    RESET_PASSWORD_USERNAME: 'native_auth.reset_password_username',
    PASSWORD_SIGN_IN_EMAIL_CODE: 'native_auth.password_sign_in_email_code',
    PASSWORD_PROVIDER: 'native_auth.password_provider',
    KEYVAULT_URL: 'native_auth.keyvault_url'
} as const;

/**
 * Utility function to parse nativeAuthConfig.json and read values based on keys
 */
export class NativeAuthConfigParser {
    private static configCache: any = null;
    private static readonly CONFIG_PATH = path.join(__dirname, '..', 'nativeAuthConfig.json');

    /**
     * Load and parse the nativeAuthConfig.json file
     * @returns Parsed configuration object
     */
    private static loadConfig(): any {
        if (!this.configCache) {
            try {
                const configData = fs.readFileSync(this.CONFIG_PATH, 'utf8');
                this.configCache = JSON.parse(configData);
            } catch (error) {
                throw new Error(`Failed to load native auth config from ${this.CONFIG_PATH}: ${error}`);
            }
        }
        return this.configCache;
    }

    /**
     * Get a value from the native auth configuration using dot notation
     * @param key - The key to retrieve (supports dot notation like 'native_auth.email_password_client_id')
     * @returns The value associated with the key
     */
    static getValue(key: string): any {
        const config = this.loadConfig();
        const keys = key.split('.');
        let value: any = config;

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                throw new Error(`Key '${key}' not found in native auth configuration`);
            }
        }

        return value;
    }

}

/**
 * Convenience function to get a value from native auth config
 * @param key - The key to retrieve (supports dot notation)
 * @returns The value associated with the key
 */
export const getNativeAuthConfigValue = (key: string): any => {
    return NativeAuthConfigParser.getValue(key);
};

/**
 * Parsed native auth configuration values
 * These are the actual values from nativeAuthConfig.json
 */
export const nativeAuthConfig = {
    emailPasswordClientId: getNativeAuthConfigValue(NATIVE_AUTH_CONFIG_KEYS.EMAIL_PASSWORD_CLIENT_ID),
    emailCodeClientId: getNativeAuthConfigValue(NATIVE_AUTH_CONFIG_KEYS.EMAIL_CODE_CLIENT_ID),
    emailPasswordAttributesClientId: getNativeAuthConfigValue(NATIVE_AUTH_CONFIG_KEYS.EMAIL_PASSWORD_ATTRIBUTES_CLIENT_ID),
    emailCodeAttributesClientId: getNativeAuthConfigValue(NATIVE_AUTH_CONFIG_KEYS.EMAIL_CODE_ATTRIBUTES_CLIENT_ID),
    tenantSubdomain: getNativeAuthConfigValue(NATIVE_AUTH_CONFIG_KEYS.TENANT_SUBDOMAIN),
    tenantId: getNativeAuthConfigValue(NATIVE_AUTH_CONFIG_KEYS.TENANT_ID),
    signInEmailPasswordUsername: getNativeAuthConfigValue(NATIVE_AUTH_CONFIG_KEYS.SIGN_IN_EMAIL_PASSWORD_USERNAME),
    signInEmailCodeUsername: getNativeAuthConfigValue(NATIVE_AUTH_CONFIG_KEYS.SIGN_IN_EMAIL_CODE_USERNAME),
    resetPasswordUsername: getNativeAuthConfigValue(NATIVE_AUTH_CONFIG_KEYS.RESET_PASSWORD_USERNAME),
    passwordSignInEmailCode: getNativeAuthConfigValue(NATIVE_AUTH_CONFIG_KEYS.PASSWORD_SIGN_IN_EMAIL_CODE),
    passwordProvider: getNativeAuthConfigValue(NATIVE_AUTH_CONFIG_KEYS.PASSWORD_PROVIDER),
    keyvaultUrl: getNativeAuthConfigValue(NATIVE_AUTH_CONFIG_KEYS.KEYVAULT_URL)
};

/**
 * Test data for negative test cases and other test-specific scenarios
 * These should not be replaced with real configuration values
 */
export const testData = {
    // Negative test case emails
    invalidUserEmail: "test123@test",
    nonRegisteredEmail: "non-registered@test.com",
    incorrectPassword: "incorrect-password",
    invalidPassword: "invalid-password!",
    invalidOtpCode: "12345678"
};


/**
 * Get test users object with real account information
 * @returns Object containing test user accounts
 */
export const getTestUsers = () => ({
    signInEmailPassword: nativeAuthConfig.signInEmailPasswordUsername,
    signInEmailCode: nativeAuthConfig.signInEmailCodeUsername,
    resetPassword: nativeAuthConfig.resetPasswordUsername,
});

/**
 * Get test data for negative test cases
 * @returns Object containing test data for negative scenarios
 */
export const getTestData = () => testData;
