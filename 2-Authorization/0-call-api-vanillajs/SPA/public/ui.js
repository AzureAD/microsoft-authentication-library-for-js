// Select DOM elements to work with
const signInButton = document.getElementById('signIn');
const signOutButton = document.getElementById('signOut');
const titleDiv = document.getElementById('title-div');
const welcomeDiv = document.getElementById('welcome-div');
const tableDiv = document.getElementById('table-div');
const tableBody = document.getElementById('table-body-div');
const todolistLink = document.getElementById('todolistLink');
const todoForm = document.getElementById('form');
const textInput = document.getElementById('textInput');
const todolistDiv = document.getElementById('groupDiv');
const todoListItems = document.getElementById('todoListItems');

todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const account = getAccount();
    let task = {
        owner: account.idTokenClaims?.oid,
        description: textInput.value,
    };
    handleTodoListActions(task, 'POST', protectedResources.apiTodoList.endpoint);
    todoForm.reset();
});

function welcomeUser(username) {
    signInButton.classList.add('d-none');
    signOutButton.classList.remove('d-none');
    todolistLink.classList.remove('d-none');
    titleDiv.classList.add('d-none');
    welcomeDiv.classList.remove('d-none');
    welcomeDiv.innerHTML = `Welcome ${username}!`;
}

function updateTable() {
    const account = getAccount();
    tableDiv.classList.remove('d-none');
    const tokenClaims = createClaimsTable(account.idTokenClaims);

    Object.keys(tokenClaims).forEach((key) => {
        let row = tableBody.insertRow(0);
        let cell1 = row.insertCell(0);
        let cell2 = row.insertCell(1);
        let cell3 = row.insertCell(2);
        cell1.innerHTML = tokenClaims[key][0];
        cell2.innerHTML = tokenClaims[key][1];
        cell3.innerHTML = tokenClaims[key][2];
    });
}

function showTodoListItems(response) {
    todoListItems.replaceChildren();
    tableDiv.classList.add('d-none');
    todoForm.classList.remove('d-none');
    todolistDiv.classList.remove('d-none');
    if (!!response.length) {
        response.forEach((task) => {
            AddTaskToTodoList(task);
        });
    }
}

function AddTaskToTodoList(task) {
    let li = document.createElement('li');
    let button = document.createElement('button');
    button.innerHTML = 'Delete';
    button.classList.add('btn', 'btn-danger');
    button.addEventListener('click', () => {
        handleTodoListActions(task, 'DELETE', protectedResources.apiTodoList.endpoint + `/${task.id}`);
    });
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
    li.innerHTML = task.description;
    li.appendChild(button);
    todoListItems.appendChild(li);
}
