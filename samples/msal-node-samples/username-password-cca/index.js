/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var msal = require("@azure/msal-node");
require('dotenv').config();

const msalConfig = {
    auth: {
        clientId: "ENTER_CLIENT_ID",
        authority: "https://login.microsoftonline.com/ENTER_TENANT_INFO",
        clientSecret: process.env.CLIENT_SECRET
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
});



