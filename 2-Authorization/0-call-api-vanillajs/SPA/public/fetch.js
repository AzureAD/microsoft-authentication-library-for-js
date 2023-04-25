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

    if (data) {
        headers.append('Content-Type', 'application/json');
    }

    const options = {
        method: method,
        headers: headers,
        body: data ? JSON.stringify(data) : null,
    };

    return fetch(endpoint, options)
        .then((response) => response);
}

let listData = [];

/**
 * Handles todo list POST and DELETE actions
 * @param {Object} task
 * @param {string} method
 * @param {string} endpoint
 */
async function handleToDoListActions(task, method, endpoint) {
    try {
        let tokenResponse;

        if (typeof getTokenPopup === 'function') {
            tokenResponse = await getTokenPopup({
                scopes: [...protectedResources.apiTodoList.scopes.write],
                redirectUri: '/redirect',
            });
        } else {
            tokenResponse = await getTokenRedirect({
                scopes: [...protectedResources.apiTodoList.scopes.write],
            });
        }

        if (tokenResponse && tokenResponse.accessToken) {
            const apiResponse = await callApi(method, endpoint, tokenResponse.accessToken, task);

            if ((method === 'POST') && (apiResponse.status === 200 || apiResponse.status === 201)) {
                const data = await apiResponse.json();
                listData = [data, ...listData];
                AddTaskToToDoList(data);
            } else if (method === 'DELETE' && apiResponse.status === 200) {
                const index = listData.findIndex((todoItem) => todoItem.id === task.id);
                listData.splice(index, 1);
                showToDoListItems(listData);
            }
        }
    } catch (error) {
        console.error(error);
    }
}

/**
 * Handles todo list action GET action.
 */
async function getToDos() {
    try {
        let tokenResponse;
        if (typeof getTokenPopup === 'function') {
            tokenResponse = await getTokenPopup({
                scopes: [...protectedResources.apiTodoList.scopes.read],
                redirectUri: '/redirect'
            });
        } else {
            tokenResponse = await getTokenRedirect({
                scopes: [...protectedResources.apiTodoList.scopes.read],
            });
        }

        if (tokenResponse && tokenResponse.accessToken) {
            const apiResponse = await callApi(
                'GET',
                protectedResources.apiTodoList.endpoint,
                tokenResponse.accessToken
            );
            const data = await apiResponse.json();
            if (data.errors) throw data;
            if (data) {
                listData = data;
                showToDoListItems(data);
            }
        }
    } catch (error) {
        console.error(error);
    }
}
