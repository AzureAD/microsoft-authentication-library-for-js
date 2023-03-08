const msal = require('@azure/msal-node');
const open = require('open');
const { msalConfig, loginRequest } = require("./authConfig");

const getTokenDeviceCode = (clientApplication) => {
   

    const deviceCodeRequest = {
        ...loginRequest,
        deviceCodeCallback: (response) => {
            console.log(response.message);
            open(response.verificationUri);
        },
    };

    return clientApplication.acquireTokenByDeviceCode(deviceCodeRequest).then((response) => {
        return response;
    }).catch((error) => {
        return error;
    });
}
// Create an MSAL PublicClientApplication object 
const msalInstance = new msal.PublicClientApplication(msalConfig);

getTokenDeviceCode(msalInstance).then(response => {
    console.log(response)
});