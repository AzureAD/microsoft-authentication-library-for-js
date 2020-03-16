var msalnode = require('./../../lib/msal-node/dist/index');

const express = require("express");
const app = express();
const port = 3000;

const msalConfig = {
    auth: {
        clientId: "b41a6fbb-c728-4e03-aa59-d25b0fd383b6",
        authority:
            "https://login.microsoftonline.com/72f988bf-86f1-41af-91ab-2d7cd011db47",
        redirectUri: "http://localhost:3000",
    },
    cache: {
        cacheLocation: "fileCache", // This configures where your cache will be stored
        storeAuthStateInCookie: false // Set this to "true" if you are having issues on IE11 or Edge
    }
};

const authApp = new msalnode.PublicClientApplication(msalConfig);

const codeRequest = {
    redirectUri: "http://localhost:3000",
    codeChallenge: "Z5kprWc6DyGa4eN8GaVnK-JSzSH2yHVeH3ByQBekvps",
    codeChallengeMethod: "S256",
    state: "2400cdfb-6a0b-4200-a368-8f2bf6d60500",
    correlationId: "43b735d3-07b5-400f-b0e0-eaeb7cae1bfe"
};

function urlCall() {
    authApp.getAuthCodeUrl(codeRequest).then((response) => {
        console.log("code response: ", response);
    }).catch((error) => {
        console.log("url construct fails", error);
    });
}
setTimeout(urlCall, 1500, 'URLCALL');

const tokenRequest = {
    redirectUri: "http://localhost:3000",
    code: "31943XseS-Ae9f0qGR0p1fruKNjZIcyVu6d-lGP3xf0",
    codeVerifier: "Du6it-JOL0XN8AEIZTQFuwp6GVeeEga3R-n3rhXFBSD9sRAo",
    state: "9c6574b9-d629-4a9b-9bde-806239b1078f",
    correlationId: "43b735d3-07b5-400f-b0e0-eaeb7cae1bfe"
};

function tokenCall() {
    authApp.acquireTokenByCode(tokenRequest).then((response) => {
        console.log("token response: ", response); setTimeout(2000);
    }).catch((error) => {
        console.log("token call fails: ", error.response);
    })
}
setTimeout(tokenCall, 1500, 'TOKENCALL');


