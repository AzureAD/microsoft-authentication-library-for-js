const dotenv = require("dotenv");
const msal = require('@azure/msal-node');
dotenv.config()

const cca = new msal.ConfidentialClientApplication({
    auth: {
        clientId: process.env.MSAL_CLIENT_ID,
        authority: process.env.MSAL_AUTHORITY,
        clientSecret: process.env.MSAL_CLIENT_SECRET,
        redirectUri: "https://localhost:3000/auth/server-redirect"
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
