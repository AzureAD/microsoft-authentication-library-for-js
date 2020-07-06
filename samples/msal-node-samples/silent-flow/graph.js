const axios = require('axios');

module.exports = {
    callMSGraph: function(endpoint, accessToken, callback) {
        const options = {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        };

        console.log('request made to Graph API at: ' + new Date().toString());

        axios.default.get(endpoint, options)
            .then(response => callback(response.data, endpoint))
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