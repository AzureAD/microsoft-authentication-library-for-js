
var msalnode = require('@azure/msal-node');

const msalConfig = {
    auth: {
        clientId: "b41a6fbb-c728-4e03-aa59-d25b0fd383b6",
        authority:
            "https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47",
    },
    cache: {
        cacheLocation: "fileCache", // This configures where your cache will be stored
        storeAuthStateInCookie: false // Set this to "true" if you are having issues on IE11 or Edge
    }
};

const pca = new msalnode.PublicClientApplication(msalConfig);

const deviceCodeRequest = {
    deviceCodeCallback: (response) => (console.log(response)),
    scopes: "user.read",
};

const response = pca.acquireTokenByDeviceCode(deviceCodeRequest);
console.log(response);