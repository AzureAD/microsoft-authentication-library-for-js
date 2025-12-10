/*
 * Browser-compatible Native Auth Configuration Parser
 * This file provides configuration values dynamically loaded from nativeAuthConfig.json
 */

// Cache for loaded configuration
let configCache = null;
let configPromise = null;

/**
 * Load configuration from nativeAuthConfig.json (internal function)
 * @returns {Promise<Object>} The parsed configuration object
 */
async function loadConfig() {
    if (configCache) {
        return configCache;
    }
    
    if (configPromise) {
        return configPromise;
    }
    
    configPromise = (async () => {
        try {
            const response = await fetch('/nativeAuthConfig.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const rawConfig = await response.json();
            
            // Transform to a flat, easy-to-use structure
            configCache = {
                emailPasswordClientId: rawConfig.native_auth.email_password_client_id,
                emailCodeClientId: rawConfig.native_auth.email_code_client_id,
                emailPasswordAttributesClientId: rawConfig.native_auth.email_password_attributes_client_id,
                emailCodeAttributesClientId: rawConfig.native_auth.email_code_attributes_client_id,
                tenantSubdomain: rawConfig.native_auth.tenant_subdomain,
                tenantId: rawConfig.native_auth.tenant_id,
                signInEmailPasswordUsername: rawConfig.native_auth.sign_in_email_password_username,
                signInEmailCodeUsername: rawConfig.native_auth.sign_in_email_code_username,
                resetPasswordUsername: rawConfig.native_auth.reset_password_username,
                resetPasswordUsernameMacos: rawConfig.native_auth.reset_password_username_macos,
                passwordSignInEmailCode: rawConfig.native_auth.password_sign_in_email_code,
                keyvaultUrl: rawConfig.native_auth.keyvault_url,
                proxyPort: 30001 // Static value for test consistency
            };
            
            return configCache;
        } catch (error) {
            console.error('Failed to load native auth configuration:', error);
            configPromise = null; // Reset promise on error to allow retry
            throw new Error(`Failed to load native auth configuration: ${error.message}`);
        }
    })();
    
    return configPromise;
}

/**
 * Initialize configuration (must be called before using sync functions)
 * @returns {Promise<Object>} The configuration object
 */
export async function initNativeAuthConfig() {
    return await loadConfig();
}


/**
 * Get client ID based on authentication flow type (synchronous)
 * @param {string} flowType - The type of auth flow
 * @returns {string} The appropriate client ID for the flow
 * @throws {Error} If configuration not loaded or invalid flow type
 */
export function getClientIdByFlow(flowType) {
    if (!configCache) {
        throw new Error('Configuration not loaded. Call initNativeAuthConfig() first.');
    }
    
    switch (flowType) {
        case "email_password":
            return configCache.emailPasswordClientId;
        case "email_code":
            return configCache.emailCodeClientId;
        case "email_password_attributes":
            return configCache.emailPasswordAttributesClientId;
        case "email_code_attributes":
            return configCache.emailCodeAttributesClientId;
        default:
            throw new Error(`Unknown flow type: ${flowType}`);
    }
}

/**
 * Build authority URL using tenant subdomain (synchronous)
 * @returns {string} The complete authority URL
 * @throws {Error} If configuration not loaded
 */
export function getAuthorityUrl() {
    if (!configCache) {
        throw new Error('Configuration not loaded. Call initNativeAuthConfig() first.');
    }
    return `https://${configCache.tenantSubdomain}.ciamlogin.com`;
}

/**
 * Get proxy port (synchronous)
 * @returns {number} The proxy port
 * @throws {Error} If configuration not loaded
 */
export function getProxyPort() {
    if (!configCache) {
        throw new Error('Configuration not loaded. Call initNativeAuthConfig() first.');
    }
    return configCache.proxyPort;
}


// Auto-initialize configuration when module loads
initNativeAuthConfig().catch(error => {
    console.error('Failed to auto-initialize native auth configuration:', error);
});
