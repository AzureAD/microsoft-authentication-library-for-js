/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var msal = require("@azure/msal-node");

const msalConfig = {
    auth: {
        clientId: "", // Enter your client_id here
        authority: "", // Enter your authority here
        clientSecret: "" // Enter your client_secret here
    }
};

const cca = new msal.ConfidentialClientApplication(msalConfig);

const usernamePasswordRequest = {
    scopes: ["user.read"],
    username: "", // Add your username here
    password: "", // Add your password here
};

cca.acquireTokenByUsernamePassword(usernamePasswordRequest).then((response) => {
    console.log("acquired token by password grant in confidential clients");
}).catch((error) => {
    console.log(error);
});



