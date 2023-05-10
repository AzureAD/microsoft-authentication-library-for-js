/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

require('dotenv').config();
const fs = require('fs');

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL Node configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md
 */

const msalConfig = {
    auth: {
        clientId: process.env.CLIENT_ID || 'Enter_the_Application_Id_Here', // 'Application (client) ID' of app registration in Azure portal - this value is a GUID
        authority: process.env.AUTHORITY || 'https://Enter_the_Tenant_Subdomain_Here.ciamlogin.com/', // Replace the placeholder with your tenant subdomain
        clientSecret: process.env.CLIENT_SECRET || 'Enter_the_Client_Secret_Here', // Client secret generated from the app registration in Azure portal
        // clientCertificate: {
        //     thumbprint:  process.env.CERT_THUMBPRINT || 'YOUR_CERT_THUMBPRINT', // replace with thumbprint obtained during step 2 above
        //     privateKey: fs.readFileSync(process.env.CERT_PRIVATE_KEY_FILE || 'PATH_TO_YOUR_PRIVATE_KEY_FILE'), // e.g. c:/Users/diego/Desktop/example.key
        // },
    },
    system: {
        loggerOptions: {
            loggerCallback(loglevel, message, containsPii) {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: 'Info',
        },
    },
};

const protectedResources = {
    apiToDoList: {
        endpoint: process.env.API_ENDPOINT || 'https://localhost:44351/api/todolist',
        scopes: [process.env.SCOPES || 'api://Enter_the_Web_Api_Application_Id_Here'],
    },
};

module.exports = {
    msalConfig,
    protectedResources,
};
