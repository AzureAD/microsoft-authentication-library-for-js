// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "CLIENT_ID", // Replace with your Client ID
        authority: "https://login.microsoftonline.com/common"
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        allowPlatformBroker: false, // Disables WAM Broker
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {	
                    return;	
                }	
                switch (level) {	
                    case msal.LogLevel.Error:	
                        console.error(message);	
                        return;	
                    case msal.LogLevel.Info:	
                    console.info(message);	
                        return;	
                    case msal.LogLevel.Verbose:	
                        console.debug(message);	
                        return;	
                    case msal.LogLevel.Warning:	
                        console.warn(message);	
                        return;
                    case msal.LogLevel.Trace:
                        console.trace(message);
                        return;	
                }
            },
            logLevel: msal.LogLevel.Verbose
        }
    }
};

// Add here scopes for id token to be used at MS Identity Platform endpoints.
const loginRequest = {
    scopes: ["openid", "profile"]
};

// SSH Public Key
const sshPublicKeyData = {
    key: PUBLIC_KEY_JWK, // Replace with your SSH Public Key in JSON Web Key object format
    keyId: "PUBLIC_KEY_ID" // Replace with the SSH Public Key's unique ID
};

// Configure SSH Certificate Request
const sshCertRequest = {
    scopes: ["https://pas.windows.net/CheckMyAccess/Linux/.default"],
    authenticationScheme: msal.AuthenticationScheme.SSH,
    sshJwk: JSON.stringify(sshPublicKeyData.key),
    sshKid: sshPublicKeyData.keyId
}
