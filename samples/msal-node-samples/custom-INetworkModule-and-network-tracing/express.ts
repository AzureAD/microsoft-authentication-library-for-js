import * as msal from "@azure/msal-node";
// import { INetworkModule, } from "@azure/msal-node";
import express from "express";
/**
 * After "npx tsc" is executed via the "npm run start" script, app.ts and HttpClientFetch.ts are compiled to .js and stored in the /dist folder
 * The app is run via "node dist/app.js", hence the .js import of the HttpClientFetch
 */
import { HttpClientFetch } from "./HttpClientFetch.js";

const SERVER_PORT = 3000;

const clientConfig: msal.Configuration = {
    auth: {
        clientId: "<ENTER_CLIENT_ID>",
        authority: "https://login.microsoftonline.com/<ENTER_TENANT_ID>",
        clientSecret: "<ENTER_CLIENT_SECRET>",
    },
    system: {
        networkClient: new HttpClientFetch(),
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

const app = express();

// type "http://localhost:3000" into the browser to trigger this route
app.get("/", async (req, res) => {
    console.log(`Request received - ${new Date()}`);

    const confidentialClientApplication =
        new msal.ConfidentialClientApplication(clientConfig);
    const response =
        await confidentialClientApplication.acquireTokenByClientCredential(
            request
        );
    return res.json(response);
});

app.listen(SERVER_PORT, () =>
    console.log(`Msal Node web app listening on port ${SERVER_PORT}!`)
);
