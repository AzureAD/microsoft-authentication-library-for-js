const scopes = ["user.read"];

module.exports = {
    /** Request Configuration */
    authCodeUrlParameters: {
        scopes: scopes,
        redirectUri: "http://localhost:3000/redirect",
        // prompt: "login" // possible values: "login", "consent", "select_account", "none"
        // domainHint: "consumers" // possible values: "organizations", "consumers", "contoso.com" etc
        // loginHint: "user@sgonz.onmicrosoft.com",
        // state: "userState",
        // responseMode: "fragment" // possible values "query", "fragment", "form-post", defaults to "query"
    },
    tokenRequest: {
        code: "",
        redirectUri: "http://localhost:3000/redirect",
        scopes: scopes,
    },
    // Build silent request
    silentRequest: {
        account: "", // Index must match the account that is trying to acquire token silently
        scopes: scopes,
    },
};
