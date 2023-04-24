let todolistData = [];

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
                todolistData = [data, ...todolistData];
                AddTaskToToDoList(data);
            } else if (method === 'DELETE' && apiResponse.status === 200) {
                const index = todolistData.findIndex((todoItem) => todoItem.id === task.id);
                todolistData.splice(index, 1);
                showToDoListItems(todolistData);
            }
        }
    } catch (error) {
        console.error(error);
    }
}

/**
 * Handles todo list action GET action.
 */
async function getTodos() {
    try {
        let tokenResponse;
        if (typeof getTokenPopup === 'function') {
            tokenResponse = await getTokenPopup({
                scopes: [ ...protectedResources.apiTodoList.scopes.read],
                redirectUri: '/redirect'
            });
        } else {
            tokenResponse = await getTokenRedirect({
                scopes: [ ...protectedResources.apiTodoList.scopes.read],
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
                todolistData = data;
                showToDoListItems(data);
            }
        }
    } catch (error) {
        console.error(error);
    }
}
