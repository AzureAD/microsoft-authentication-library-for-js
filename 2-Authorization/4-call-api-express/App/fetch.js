/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const axios = require('axios');

/**
 * Makes an Authorization "Bearer" request with the given accessToken to the given endpoint.
 * @param endpoint
 * @param accessToken
 * @param method
 */
const callEndpointWithToken = async (endpoint, accessToken, method, data = null) => {
    const options = {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    };

    switch (method) {
        case 'GET':
            return await axios.get(endpoint, options);
        case 'POST':
            return await axios.post(endpoint, data, options);
        case 'DELETE':
            return await axios.delete(endpoint + `/${data}`, options);
        default:
            return null;
    }
};

module.exports = {
    callEndpointWithToken,
};
