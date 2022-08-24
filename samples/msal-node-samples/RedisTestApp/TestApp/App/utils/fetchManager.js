/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

const { default: axios } = require('axios');

callAPI = async(endpoint, accessToken) => {

    if (!accessToken || accessToken === "") {
        throw new Error('No tokens found')
    }
    
    const options = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    };
    
    console.log('request made to web API at: ' + new Date().toString());

    try {
        const response = await axios.default.get(endpoint, options);
        return response.data;
    } catch(error) {
        console.log(error)
        return error;
    }
}

module.exports = {
    callAPI
};