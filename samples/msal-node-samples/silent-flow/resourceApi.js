/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

module.exports = function(resourceApiConfig) {
    // Get authority type specific Resource API Config
    const endpoint = resourceApiConfig.endpoint;
    
    return {
        call: async function(accessToken, callback) {
            const options = {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            };

            console.log('request made to Resource API at: ' + new Date().toString());
            
            const response = await fetch(endpoint, options);
            if (!response.ok) {
                throw new Error(`Resource API request failed with status ${response.status}`);
            }
            const data = await response.json();
            callback(data, endpoint);
        }
    }
};