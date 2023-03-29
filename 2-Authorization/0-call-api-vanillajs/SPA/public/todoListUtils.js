function createTodo(task) {
    handleTodoList(task, 'POST', protectedResources.apiTodoList.endpoint);
}

function deleteTodo(task) {
    handleTodoList(task, 'DELETE', protectedResources.apiTodoList.endpoint + `/${task.id}`);
}

function AddTaskToList(todo) {
    todolistData = [todo, ...todolistData];
    console.log(todolistData);
    AddToListItem(todo);
}

function RemoveTaskFromList(todo) {
    const index = todolistData.findIndex((todoItem) => todoItem.id === todo.id);
    todolistData.splice(index, 1);
    console.log(todolistData, " in delete");
    showTodoListItems(todolistData);
}



