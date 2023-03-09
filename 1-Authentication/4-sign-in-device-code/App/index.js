const msal = require('@azure/msal-node');
const { msalConfig, loginRequest } = require("./authConfig");

const getTokenDeviceCode = (clientApplication) => {
    /**
     * Device Code Request. For more information visit:
     * https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_node.html#devicecoderequest
     */
    const deviceCodeRequest = {
        ...loginRequest,
        deviceCodeCallback: (response) => {
            console.log(response.message);
        },
    };

    /**
     * The code below demonstrates the correct usage pattern of the acquireTokenByDeviceCode API.
     * The application uses MSAL to obtain an Access Token through the Device Code grant.
     * Once the device code request is executed, the user will be prompted by the headless application to visit a URL,
     * where they will input the device code shown in the console. Once the code is entered, the promise below should resolve
     * with an AuthenticationResult object. For information about acquireTokenByDeviceCode see:
     * https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_node.publicclientapplication.html#acquiretokenbydevicecode
     *
     */
    return clientApplication
        .acquireTokenByDeviceCode(deviceCodeRequest)
        .then((response) => {
            return response;
        })
        .catch((error) => {
            return error;
        });
}

/**
 * Instantiate MSAL PublicClientApplication object, for more information visit: 
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/initialize-public-client-application.md
 */
const msalInstance = new msal.PublicClientApplication(msalConfig);

getTokenDeviceCode(msalInstance).then(response => {
    console.log(response)
});