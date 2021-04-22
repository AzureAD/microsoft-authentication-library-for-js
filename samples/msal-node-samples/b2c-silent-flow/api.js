const axios = require('axios');

module.exports = {
    callWebApi: (endpoint, accessToken, callback) => {

        const options = {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        };

        console.log('request made to web API at: ' + new Date().toString());

        axios.default.get(endpoint, options)
            .then(response => callback(response.data))
            .catch(error => console.log(error));
    }
};