// Config object to be passed to Msal on creation
export const msalConfig = {
    auth: {
        clientId: "9067c884-9fa6-414f-9aa4-a565b1cb46be",
        authority: "https://fabrikamb2c.b2clogin.com/fabrikamb2c.onmicrosoft.com/b2c_1_susi_reset_v2",
        knownAuthorities: ["fabrikamb2c.b2clogin.com"],
        redirectUri: "http://localhost:4200",
        postLogoutRedirectUri: "http://localhost:4200"
    }
};

// Scopes you add here will be prompted for consent during login
export const loginRequest = {
    scopes: ["https://fabrikamb2c.onmicrosoft.com/helloapi/demo.read"]
};
