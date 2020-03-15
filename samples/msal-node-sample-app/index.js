var msalnode = require('./../../lib/msal-node/dist/index');

const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => res.send("Hello World!"));
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

const msalConfig = {
    auth: {
        clientId: "b41a6fbb-c728-4e03-aa59-d25b0fd383b6",
        authority:
            "https://login.microsoftonline.com/",
        redirectUri: "http://localhost:3000"
    },
    cache: {
        cacheLocation: "fileCache", // This configures where your cache will be stored
        storeAuthStateInCookie: false // Set this to "true" if you are having issues on IE11 or Edge
    }
};

const authApp = new msalnode.PublicClientApplication(msalConfig);
const request = {
    scopes: ["user.read"],
    redirectUri: "http://localhost:3000",
    codeChallenge: "31943XseS-Ae9f0qGR0p1fruKNjZIcyVu6d-lGP3xf0",
    codeChallengeMethod: "sha256",
    state: "2400cdfb-6a0b-4200-a368-8f2bf6d60500",
    correlationId: "43b735d3-07b5-400f-b0e0-eaeb7cae1bfe"
};

let url = getUrl;
async function getUrl(request) {
    try {
        url = await authApp.getAuthCodeUrl(request);
    } catch (e) {
        throw e;
    }
}

app.get("/", (req, res) => res.send(url));
app.listen(port, () => console.log(`URL: ${url}!`));
