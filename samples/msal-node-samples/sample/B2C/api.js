const axios = require("axios");

// helper function to access the resource with the token
module.exports = {
    callApiWithAccessToken: function (endpoint, accessToken, callback) {
        const options = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        };

        console.log(
            "request made to web API(B2C) at: " + new Date().toString()
        );

        axios.default
            .get(endpoint, options)
            .then((response) => callback(response.data, endpoint))
            .catch((error) => console.log(error));
    },
};
