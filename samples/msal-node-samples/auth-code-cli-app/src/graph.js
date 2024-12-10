const axios = require('axios').default;
const { graphMeEndpoint } = require("./authConfig.js")

async function callMicrosoftGraph(accessToken) {
    console.log("Calling Microsoft Graph");
    const options = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    };

    try {
        const response = await axios.get(graphMeEndpoint, options);
        return response.data;
    } catch (error) {
        return error;
    }
};

module.exports = {
    callMicrosoftGraph: callMicrosoftGraph
}