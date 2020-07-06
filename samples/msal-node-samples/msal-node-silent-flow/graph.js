const fetch = require('node-fetch');

module.exports = {
    callMSGraph: function(endpoint, accessToken, callback) {
        const headers = new fetch.Headers();
        const bearer = `Bearer ${accessToken}`;

        headers.append("Authorization", bearer);

        const options = {
            method: "GET",
            headers: headers
        };

        console.log('request made to Graph API at: ' + new Date().toString());

        fetch(endpoint, options)
            .then(response => response.json())
            .then(response => callback(response, endpoint))
            .catch(error => console.log(error));
        },

    buildGraphProfile: function(graphResponse) {
        return {
            name: graphResponse.displayName,
            title: graphResponse.jobTitle,
            mail: graphResponse.mail,
            phone: graphResponse.businessPhones[0],
            location: graphResponse.officeLocation
        }
    }
};