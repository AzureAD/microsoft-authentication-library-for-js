/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

require('dotenv').config();

const TENANT_NAME = process.env.TENANT_NAME || 'Enter_the_Tenant_Name_Here';
const REDIRECT_URI = process.env.REDIRECT_URI || 'http://localhost:3000/auth/redirect';
const POST_LOGOUT_REDIRECT_URI = process.env.POST_LOGOUT_REDIRECT_URI || 'http://localhost:3000';

/**
 * Configuration object to be passed to MSAL instance on creation.
 * For a full list of MSAL Node configuration parameters, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/docs/configuration.md
 */
const msalConfig = {
    auth: {
        clientId: process.env.CLIENT_ID || 'Enter_the_Application_Id_Here', // 'Application (client) ID' of app registration in Azure portal - this value is a GUID
        authority: process.env.AUTHORITY || `https://${TENANT_NAME}.ciamlogin.com/`, // replace "Enter_the_Tenant_Name_Here" with your tenant name
        clientSecret: process.env.CLIENT_SECRET || 'Enter_the_Client_Secret_Here', // Client secret generated from the app registration in Azure portal
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

const toDoListReadScope = process.env.TODOLIST_READ || 'api://Enter_the_Web_Api_Application_Id_Here/ToDoList.Read';
const toDoListReadWriteScope = process.env.TODOLIST_READWRITE || 'api://Enter_the_Web_Api_Application_Id_Here/ToDoList.ReadWrite';

const protectedResources = {
    toDoListAPI: {
        endpoint: 'https://localhost:44351/api/todolist',
        scopes: {
            read: [toDoListReadScope],
            write: [toDoListReadWriteScope],
        },
    },
};

module.exports = {
    msalConfig,
    protectedResources,
    TENANT_NAME,
    REDIRECT_URI,
    POST_LOGOUT_REDIRECT_URI,
};
