/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const axios = require('axios');

module.exports = function(resourceApiConfig) {
    // Get authority type specific Resource API Config
    const endpoint = resourceApiConfig.endpoint;
    
    return {
        call: function(accessToken, callback) {
            const options = {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            };

            console.log('request made to Resource API at: ' + new Date().toString());
            
;            axios.default.get(endpoint, options)
                .then(response => callback(response.data, endpoint))
                .catch(error => console.log(error));
        }
    }
};