/*
 * MSAL Native Auth Configuration
 */

// Access LogLevel from the global msalCustomAuth object
const { LogLevel } = msalCustomAuth;

import { Utilities } from './utilities.js';
import { 
    initNativeAuthConfig,
    getClientIdByFlow, 
    getAuthorityUrl, 
    getProxyPort 
} from './configParser.js';

/**
 * Get client ID based on URL parameters or default to email/password flow
 * @returns {string} The appropriate client ID
 */
function getClientId() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('usePwdConfig') === 'true') {
        return getClientIdByFlow('email_password');
    } else if (urlParams.get('useOtpConfig') === 'true') {
        return getClientIdByFlow('email_code');
    } else if (urlParams.get('usePwdAttributesConfig') === 'true') {
        return getClientIdByFlow('email_password_attributes');
    } else if (urlParams.get('useOtpAttributesConfig') === 'true') {
        return getClientIdByFlow('email_code_attributes');
    }
    
    // Default to email/password flow
    return getClientIdByFlow('email_password');
}

/**
 * Get challenge types based on URL parameters
 * @returns {string[]} Array of supported challenge types
 */
function getChallengeTypes() {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('useRedirectConfig') === 'true') {
        return ["redirect"]; // Only redirect for testing redirect-only scenarios
    }
    
    return ["password", "oob", "redirect"]; // Default challenge types
}

/**
 * Initialize and get MSAL configuration with dynamic values
 * @returns {Promise<Object>} The MSAL configuration object
 */
async function initMsalConfig() {
    // Ensure config is loaded first
    await initNativeAuthConfig();
    
    const clientId = getClientId();
    const authority = getAuthorityUrl();
    const proxyPort = getProxyPort();
    
    return {
        customAuth: {
            challengeTypes: getChallengeTypes(),
            authApiProxyUrl: `http://localhost:${proxyPort}/api`,
        },
        auth: {
            clientId: clientId,
            authority: authority,
            redirectUri: "/", // You must register this URI on Azure Portal/App Registration. Defaults to window.location.href e.g. http://localhost:3000/
            postLogoutRedirectUri: "",
            navigateToLoginRequestUrl: false,
        },
        cache: {
            cacheLocation: "sessionStorage",
            storeAuthStateInCookie: false,
        },
        system: {
            loggerOptions: {
                loggerCallback: (level, message, containsPii) => {
                    if (containsPii) {
                        return;
                    }
                    switch (level) {
                        case LogLevel.Error:
                            Utilities.logMessage(message, "error");
                            return;
                        case LogLevel.Info:
                            Utilities.logMessage(message, "info");
                            return;
                        case LogLevel.Verbose:
                            Utilities.logMessage(message, "info"); // Use info for verbose as we don't have a debug level
                            return;
                        case LogLevel.Warning:
                            Utilities.logMessage(message, "warning");
                            return;
                    }
                },
            }
        }
    };
}

// Export the initialization function
export { initMsalConfig };
