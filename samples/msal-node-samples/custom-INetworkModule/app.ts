import * as msal from "@azure/msal-node";
// import { INetworkModule, } from "@azure/msal-node";
/**
 * After "npx tsc" is executed via the "npm run start" script, app.ts and HttpClientAxios.ts are compiled to .js and stored in the /dist folder
 * The app is run via "node dist/app.js", hence the .js import of the HttpClientAxios
 */
import { HttpClientAxios } from "./HttpClientAxios.js";

const clientConfig: msal.Configuration = {
    auth: {
        clientId: "<ENTER_CLIENT_ID>",
        authority: "https://login.microsoftonline.com/<ENTER_TENANT_ID>",
        clientSecret: "<ENTER_CLIENT_SECRET>",
    },
    system: {
        networkClient: new HttpClientAxios(),
        /**
         * This is the same functionality as the networkClient line above. Instead of importing a custom INetworkModule, one can be implemented here.
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
