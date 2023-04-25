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
        .then((response) => {
            const contentType = response.headers.get("content-type");
            
            if (contentType && contentType.indexOf("application/json") !== -1) {
                return response.json();
            } else {
                return response;
            }
        });
}


/**
 * Handles todolist actions
 * @param {Object} task
 * @param {string} method
 * @param {string} endpoint
 */
async function handleToDoListActions(task, method, endpoint) {
    let listData;

    try {
        const accessToken = await getToken();
        const data = await callApi(method, endpoint, accessToken, task);

        switch (method) {
            case 'POST':
                listData = JSON.parse(localStorage.getItem('todolist'));
                listData = [data, ...listData];
                localStorage.setItem('todolist', JSON.stringify(listData));
                AddTaskToToDoList(data);
                break;
            case 'DELETE':
                listData = JSON.parse(localStorage.getItem('todolist'));
                const index = listData.findIndex((todoItem) => todoItem.id === task.id);
                localStorage.setItem('todolist', JSON.stringify([...listData.splice(index, 1)]));
                showToDoListItems(listData);
                break;
            default:
                console.log('Unrecognized method.')
                break;
        }
    } catch (error) {
        console.error(error);
    }
}

/**
 * Handles todolist action GET action.
 */
async function getToDos() {
    try {
        const accessToken = await getToken();

        const data = await callApi(
            'GET',
            protectedResources.toDoListAPI.endpoint,
            accessToken
        );

        if (data) {
            localStorage.setItem('todolist', JSON.stringify(data));
            showToDoListItems(data);
        }
    } catch (error) {
        console.error(error);
    }
}

/**
 * Retrieves an access token.
 */
async function getToken() {
    let tokenResponse;

    if (typeof getTokenPopup === 'function') {
        tokenResponse = await getTokenPopup({
            scopes: [...protectedResources.toDoListAPI.scopes.read],
            redirectUri: '/redirect'
        });
    } else {
        tokenResponse = await getTokenRedirect({
            scopes: [...protectedResources.toDoListAPI.scopes.read],
        });
    }

    if (!tokenResponse) {
        return null;
    }

    return tokenResponse.accessToken;
}
