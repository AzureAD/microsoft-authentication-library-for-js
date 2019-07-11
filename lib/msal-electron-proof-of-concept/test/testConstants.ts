// Test URIs
export const TEST_URIS = {
    DEFAULT_INSTANCE: 'https://login.microsoftonline.com/',
    DEFAULT_INSTANCE_NO_SLASH: 'https://login.microsoftonline.com',
    DEFAULT_INSTANCE_UPCASE:  'HTTPS://LOGIN.MICROSOFTONLINE.COM',
    REDIRECT_URI: 'https://127.0.0.1/auth/',
};

// Test Configuration
export const TEST_CONFIGURATION = {
    TENANT: 'common',
    MSAL_CLIENT_ID: '813e1d1-ad72-46a9-8665-399bba48c201',
    MSAL_TENANT_ID: '3338040d-6c67-4c5b-b112-36a304b66dad',
    validAuthority: `${TEST_URIS.DEFAULT_INSTANCE}common`,
};
