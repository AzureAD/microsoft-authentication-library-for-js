import * as msal from "@azure/msal-node";
// import { INetworkModule, } from "@azure/msal-common";
/**
 * After "npx tsc" is executed via the "npm run start" script, app.ts and HttpClient.ts are compiled to .js and stored in the /dist folder
 * The app is run via "node dist/app.js", hence the .js import of the HttpClient
 */
// import HttpClient from "./HttpClient.js";

const clientConfig: msal.Configuration = {
    auth: {
        clientId: "<ENTER_CLIENT_ID>",
        authority: "https://login.microsoftonline.com/<ENTER_TENANT_ID>",
        clientSecret: "<ENTER_CLIENT_SECRET>",
    },
    system: {
        /**
         * Uncomment this to see this application's network trace inside of "Fiddler Everywhere" (https://www.telerik.com/download/fiddler-everywhere)
         * 8866 is Fiddler's default port, and is configurable inside of Fiddler's settings
         */
        // proxyUrl: "http://localhost:8866",

        /**
         * Uncomment the HttpClient import statement to use this custom INetworkModule
         * The contents of ./HttpClient.ts are the default msal-node network functionality, copied from:
         * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/src/network/HttpClient.ts
         * (@azure/msal-node version 1.14.2)
         * Changes were made to account for the imported constants
         * console.log()'s can be added to help the developer debug network issues
         */ 
        // networkClient: new HttpClient,


        /**
         * This is the same functionality as the line above. Instead of importing the custom INetworkModule, it can be implemented here
         * Uncomment the INetworkModule import to implement this custom INetworkModule
         */
        /** networkClient: new class CustomHttpClient implements INetworkModule {
            sendGetRequestAsync<T>(url: string, options?: msal.NetworkRequestOptions, cancellationToken?: number): Promise<msal.NetworkResponse<T>> {
                console.log("Get Method not implemented.");
                throw new Error("Get Method not implemented.");
            }
            sendPostRequestAsync<T>(url: string, options?: msal.NetworkRequestOptions): Promise<msal.NetworkResponse<T>> {
                console.log("Post Method not implemented.");
                throw new Error("Post Method not implemented.");
            }
        } */
    },
};

const request: msal.ClientCredentialRequest = {
    scopes: ["https://graph.microsoft.com/.default"],
};

// self-executing anonymous asyc function that's needed to use "await" for acquireTokenByClientCredential
(async () => {
    try {
        const confidentialClientApplication = new msal.ConfidentialClientApplication(clientConfig);
        const token = await confidentialClientApplication.acquireTokenByClientCredential(request);
        console.log(token);
    } catch (error) {
        console.log(error);
    }
})();