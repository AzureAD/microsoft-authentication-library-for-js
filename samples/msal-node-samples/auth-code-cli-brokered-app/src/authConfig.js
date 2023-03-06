const { LogLevel } = require("@azure/msal-node");
const { NativeBrokerPlugin } = require("@azure/msal-node-extensions");

const cacheLocation = "./src/data/cache.json";
const cachePlugin = require('../../cachePlugin')(cacheLocation);

module.exports = {
    authConfig: {
        auth: {
            clientId: "ENTER_CLIENT_ID",
            authority: "https://login.microsoftonline.com/ENTER_TENANT_INFO",
        },
        cache: {
            cachePlugin
        },
        system: {
            loggerOptions: {
                loggerCallback(loglevel, message, containsPii) {
                    console.log(message);
                },
                piiLoggingEnabled: false,
                logLevel: LogLevel.Trace,
            }
        },
        broker: {
            nativeBrokerPlugin: new NativeBrokerPlugin()
        }
    },
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
};