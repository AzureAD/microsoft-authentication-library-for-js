/**
 * Test configuration for Native Auth Sample E2E tests
 * Contains tenant information, proxy settings, timeouts, and test user data
 */

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
    
    testUsers: {
        signInEmailUsername: "nativeauthuser1@1secmail.org",
        signInEmailOtpUsername: "nativeauthuser5@chefalicious.com",
        labSecretName: "MSIDLABCIAM6"
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