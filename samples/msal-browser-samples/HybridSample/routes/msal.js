const dotenv = require("dotenv");
const msal = require('@azure/msal-node');
dotenv.config()

const cca = new msal.ConfidentialClientApplication({
    auth: {
        clientId: process.env.MSAL_CLIENT_ID,
        authority: "https://login.microsoftonline.com/common",
        clientSecret: process.env.MSAL_CLIENT_SECRET
    },
    system: {
        loggerOptions: {
            loggerCallback: (loglevel, message, containsPii) => {
                console.log(message);
            },
            piiLoggingEnabled: false,
            logLevel: msal.LogLevel.Verbose,
        }
    }
});

module.exports = cca;
