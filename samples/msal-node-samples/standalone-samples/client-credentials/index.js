/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var msal = require('@azure/msal-node');

const config = {
    auth: {
        clientId: "12d77c73-d09d-406a-ae0d-3d4e576f7d9b",
        authority: "https://login.microsoftonline.com/90b8faa8-cc95-460e-a618-ee770bee1759",
        clientSecret: ""
   } 
};

// Create msal application object
const cca = new msal.ConfidentialClientApplication(config);

// With client credentials flows permissions need to be granted in the portal by a tenant administrator. 
// The scope is always in the format "<resource>/.default"
const clientCredentialRequest = {
    scopes: ["https://graph.microsoft.com/.default"],
};

cca.acquireTokenByClientCredential(clientCredentialRequest).then((response) => {
    console.log("Response: ", response);
}).catch((error) => {
    console.log(JSON.stringify(error));
});
