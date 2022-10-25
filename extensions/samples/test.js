const extensions = require("../msal-node-extensions");

const plugin = new extensions.NativeBrokerPlugin("04f0c124-f2bc-4f59-8241-bf6df9866bbd");
async function testFunction() {
    const request = {
        scopes: ["User.Read"],
        authority: "https://login.microsoftonline.com/common",
        redirectUri: "http://localhost",
        correlationId: "test-correlationId"
    }
    const result = await plugin.acquireTokenInteractive(request);
}

testFunction();