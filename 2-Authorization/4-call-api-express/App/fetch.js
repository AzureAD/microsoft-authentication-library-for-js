/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const axios = require('axios');

/**
 * Makes an Authorization "Bearer"  request with the given accessToken to the given endpoint.
 * @param endpoint
 * @param accessToken
 * @param method
 */
const callEndpointWithToken = async (endpoint, accessToken, method, data = null) => {
    try {
        let response;

        const options = {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        };

        if (method === 'GET') {
            response = await axios.default.get(endpoint, options);
        } else if (method === 'POST') {
            response = await axios.post(endpoint, data, options);
        } else if (method === 'DELETE') {
            response = await axios.delete(endpoint + `/${data}`, options);
        }
        return response;
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    callEndpointWithToken,
};
