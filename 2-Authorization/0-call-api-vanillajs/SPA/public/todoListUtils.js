let todolistData = [];

/**
 * Handles todo list POST and DELETE actions
 * @param {Object} task
 * @param {string} method
 * @param {string} endpoint
 */
async function handleTodoListActions(task, method, endpoint) {
    try {
        let tokenResponse;
        if (typeof getTokenPopup === 'function') {
    
            tokenResponse = await getTokenPopup();
        } else {
            tokenResponse = await getTokenRedirect();
        }

        if (tokenResponse && tokenResponse.accessToken) {
            const apiResponse = await callApi(method, endpoint, tokenResponse.accessToken, task);
            if ((method === 'POST' && apiResponse.status === 200) || apiResponse.status === 201) {
                const data = await apiResponse.json();
                todolistData = [data, ...todolistData];
                AddTaskToTodoList(data);
            } else if (method === 'DELETE' && apiResponse.status === 204) {
                const index = todolistData.findIndex((todoItem) => todoItem.id === task.id);
                todolistData.splice(index, 1);
                showTodoListItems(todolistData);
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
            tokenResponse = await getTokenPopup();
        } else {
            tokenResponse = await getTokenRedirect();
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
                showTodoListItems(data);
            }
        }
    } catch (error) {
        console.error(error);
    }
}
