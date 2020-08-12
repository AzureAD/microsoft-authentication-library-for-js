// Test URIs
export const TEST_URIS = {
    DEFAULT_INSTANCE: 'https://login.microsoftonline.com/',
    DEFAULT_INSTANCE_NO_SLASH: 'https://login.microsoftonline.com',
    DEFAULT_INSTANCE_UPCASE: 'HTTPS://LOGIN.MICROSOFTONLINE.COM/',
    REDIRECT_URI: 'msal://auth/',
};

// Test Configuration
export const TEST_CONFIGURATION = {
    TENANT: 'common',
    MSAL_CLIENT_ID: '813e1d1-ad72-46a9-8665-399bba48c201',
    MSAL_TENANT_ID: '3338040d-6c67-4c5b-b112-36a304b66dad',
    validAuthority: `${TEST_URIS.DEFAULT_INSTANCE}common/`,
    scopes: ['user.read', 'mail.read'],
    spaceSeparatedScopes: 'user.read mail.read'
};

// Valid Auth Configuration
export const TEST_VALID_AUTH_CONFIGURATION = {
    clientId: TEST_CONFIGURATION.MSAL_CLIENT_ID,
    authority: TEST_CONFIGURATION.validAuthority,
    redirectUri: TEST_URIS.REDIRECT_URI,
};

// Endpoint URLs
export const TEST_ENDPOINT_URIS = {
    AAD_AUTHORIZATION_ENDPOINT: `${TEST_CONFIGURATION.validAuthority}oauth2/v2.0/authorize`
};

// Test Cryptographic params
export const TEST_CRYPTO_PARAMS = {
    state: '12345',
    PKCECodeChallenge: '_YaeH2D_WZDTZMFcTok-inFVnZInzqfXZgj4jSTqWYA',
    PKCECodeVerifier: 'cBMWNNnLdc6894aitUz27PI8NaRQ5o9pJqnzGtqcz94'
};
