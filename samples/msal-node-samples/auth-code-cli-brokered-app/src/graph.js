const { graphMeEndpoint } = require("./authConfig.js")

async function callMicrosoftGraph(accessToken) {
    console.log("Calling Microsoft Graph");
    const options = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    };

    try {
        const response = await fetch(graphMeEndpoint, options);
        return response.json();
    } catch (error) {
        return error;
    }
};

module.exports = {
    callMicrosoftGraph: callMicrosoftGraph
}