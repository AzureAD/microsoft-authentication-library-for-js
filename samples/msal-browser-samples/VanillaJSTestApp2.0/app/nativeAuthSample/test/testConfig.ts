/**
 * Test configuration for Native Auth Sample E2E tests
 * Contains tenant information, proxy settings, timeouts, and test user data
 */

export interface TestConfig {
    tenant: {
        name: string;
        id: string;
        labKeyVaultName: string;
    };
    proxy: {
        port: number;
        enabled: boolean;
    };
    timeouts: {
        standard: number;
        auth: number;
        test: number;
    };
    testUsers: {
        signInEmailWithPwd: string;
        signInEmailWithOtp: string;
        labSecretName: string;
    };
    screenshots: {
        enabled: boolean;
        baseFolderName: string;
    };
}

/**
 * Default test configuration
 * Update these values based on your test environment
 */
export const testConfig: TestConfig = {
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
        signInEmailWithPwd: "nativeauthuser1@1secmail.org",
        signInEmailWithOtp: "nativeauthuser5@chefalicious.com",
        labSecretName: "MSIDLABCIAM6"
    },
    
    screenshots: {
        enabled: true,
        baseFolderName: "./screenshots"
    }
};

/**
 * Environment-specific configurations
 */
export const getEnvironmentConfig = (environment?: string): Partial<TestConfig> => {
    switch (environment) {
        case 'dev':
            return {
                proxy: {
                    ...testConfig.proxy,
                    port: 30002
                }
            };
        case 'ci':
            return {
                screenshots: {
                    ...testConfig.screenshots,
                    enabled: false
                },
                timeouts: {
                    ...testConfig.timeouts,
                    standard: 30000,
                    auth: 45000,
                    test: 90000
                }
            };
        default:
            return {};
    }
};

/**
 * Get configuration with optional environment overrides
 */
export const getConfig = (environment?: string): TestConfig => {
    const envConfig = getEnvironmentConfig(environment);
    return {
        ...testConfig,
        ...envConfig,
        tenant: { ...testConfig.tenant, ...envConfig.tenant },
        proxy: { ...testConfig.proxy, ...envConfig.proxy },
        timeouts: { ...testConfig.timeouts, ...envConfig.timeouts },
        testUsers: { ...testConfig.testUsers, ...envConfig.testUsers },
        screenshots: { ...testConfig.screenshots, ...envConfig.screenshots }
    };
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