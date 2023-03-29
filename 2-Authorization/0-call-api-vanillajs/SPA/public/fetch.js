/**
 *  Execute a fetch request with the given options
 * @param {string} method: GET, POST, PUT, DELETE
 * @param {String} endpoint: The endpoint to call
 * @param {Object} data: The data to send to the endpoint, if any
 * @returns response
 */
function callApi(method, endpoint, token, data = null) {
    const headers = new Headers();
    const bearer = `Bearer ${token}`;

    headers.append('Authorization', bearer);

    if (data) headers.append('Content-Type', 'application/json');

    const options = {
        method: method,
        headers: headers,
        body: data ? JSON.stringify(data) : null,
    };

    return fetch(endpoint, options).then((response) => response);
}
