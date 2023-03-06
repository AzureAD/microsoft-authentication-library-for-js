const dotenv = require("dotenv");
const msal = require('@azure/msal-node');
dotenv.config()

const cca = new msal.ConfidentialClientApplication({
    auth: {
        clientId: process.env.MSAL_CLIENT_ID,
        authority: process.env.MSAL_AUTHORITY,
        clientSecret: process.env.MSAL_CLIENT_SECRET
    },
    system: {
        loggerOptions: {
            loggerCallback: (loglevel, message, containsPii) => {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Info,
        }
    }
});

module.exports = cca;
