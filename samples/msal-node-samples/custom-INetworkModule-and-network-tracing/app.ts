import * as msal from "@azure/msal-node";
// import { INetworkModule, } from "@azure/msal-node";
/**
 * After "npx tsc" is executed via the "npm run start" script, app.ts and HttpClientCurrent.ts are compiled to .js and stored in the /dist folder
 * The app is run via "node dist/app.js", hence the .js import of the HttpClientCurrent
 */
// import { HttpClientCurrent } from "./HttpClientCurrent.js";
// import { HttpClientAxios } from "./HttpClientAxios.js";

const clientConfig: msal.Configuration = {
    auth: {
        clientId: "<ENTER_CLIENT_ID>",
        authority: "https://login.microsoftonline.com/<ENTER_TENANT_ID>",
        clientSecret: "<ENTER_CLIENT_SECRET>",
    },
    system: {
        /**
         * Uncomment this to see this application's network trace inside of "Fiddler Everywhere" (https://www.telerik.com/download/fiddler-everywhere)
         * 8866 is Fiddler Everywhere's default port
         * 8888 is Fiddler Classic's default port
         * These are both configurable inside of Fiddler's settings
         * NOTE: Axios does not support proxy functionality. Therefore, neither does HttpClientAxios. The following 2 lines of code are only supported by HttpClientCurrent.
         */
        // proxyUrl: "http://localhost:8866", // Fiddler Everywhere default port
        // proxyUrl: "http://localhost:8888", // Fiddler Classic default port
        /**
         * Uncomment either of the HttpClient import statement to use a custom INetworkModule
         * The contents of ./HttpClientCurrent.ts are the default msal-node network functionality (msal-node v1.15.0), copied from:
         * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-node/src/network/HttpClient.ts
         * The contents of ./HttpClientAxios.ts are the msal-node network functionality from when Axios was used - before the HttpClient was rewritten to support proxys - copied from:
         * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/2c77739f9e36538bb68029969d526a3fa37017d7/lib/msal-node/src/network/HttpClient.ts
         * Changes were made to account for the imported constants
         * console.log()'s can be added to help the developer debug network issues
         */
        // networkClient: new HttpClientCurrent,
        // networkClient: new HttpClientCurrent(<proxyUrl>, <customHttp(s)AgentOptions>),
        // networkClient: new HttpClientAxios,
        /**
         * This is the same functionality as the networkClient lines above. Instead of importing a custom INetworkModule, one can be implemented here.
         * Uncomment the INetworkModule import statement to implement the custom INetworkModule below
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
    const confidentialClientApplication =
        new msal.ConfidentialClientApplication(clientConfig);
    const response =
        await confidentialClientApplication.acquireTokenByClientCredential(
            request
        );
    console.log(response);
})();
