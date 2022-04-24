const appSettings = {
    appCredentials: {
        clientId: "client-id", // Application (client) ID for MSAL-Node application
        authority: "authority",
        tenantId: "tenant-id", // Directory (tenant) ID
        clientSecret: "client-secret",
        protocolMode: "AAD"
    },
    authRoutes: {
        redirect: "/redirect",
        error: "/error", // the app will redirect to this route in case of any error.
        unauthorized: "/unauthorized" // the app will redirect to this route in case of unauthorized access attempt.
    },
    settings: {
        redirectUri: "http://localhost:4000/redirect",
        postLogoutRedirectUri: 'http://localhost:4000/'
    },
    protectedResources: {
        custom: {
            scopes: ["add-custom-scope-here"]
        }
    },
    validationParameters: { // Parameters for validating access token
        validIssuers: [`https://sts.windows.net/YOUR_TENANT_ID_HERE/`],
        validAudiences: [`api://YOUR_CLIENT_ID_HERE`]
    }
}

module.exports = appSettings;