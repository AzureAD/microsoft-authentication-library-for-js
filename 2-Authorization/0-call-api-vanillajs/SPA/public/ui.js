// Select DOM elements to work with
const signInButton = document.getElementById('signIn');
const signOutButton = document.getElementById('signOut');
const titleDiv = document.getElementById('title-div');
const welcomeDiv = document.getElementById('welcome-div');
const tableDiv = document.getElementById('table-div');
const tableBody = document.getElementById('table-body-div');
const toDoListLink = document.getElementById('toDoListLink');
const toDoForm = document.getElementById('form');
const textInput = document.getElementById('textInput');
const toDoListDiv = document.getElementById('groupDiv');
const todoListItems = document.getElementById('toDoListItems');

toDoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let task = { description: textInput.value };
    handleToDoListActions(task, 'POST', protectedResources.toDoListAPI.endpoint);
    toDoForm.reset();
});

function welcomeUser(username) {
    signInButton.classList.add('d-none');
    signOutButton.classList.remove('d-none');
    toDoListLink.classList.remove('d-none');
    titleDiv.classList.add('d-none');
    welcomeDiv.classList.remove('d-none');
    welcomeDiv.innerHTML = `Welcome ${username}!`;
}

function updateTable(account) {
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

function showToDoListItems(response) {
    todoListItems.replaceChildren();
    tableDiv.classList.add('d-none');
    toDoForm.classList.remove('d-none');
    toDoListDiv.classList.remove('d-none');
    if (!!response.length) {
        response.forEach((task) => {
            AddTaskToToDoList(task);
        });
    }
}

function AddTaskToToDoList(task) {
    let li = document.createElement('li');
    let button = document.createElement('button');
    button.innerHTML = 'Delete';
    button.classList.add('btn', 'btn-danger');
    button.addEventListener('click', () => {
        handleToDoListActions(task, 'DELETE', protectedResources.toDoListAPI.endpoint + `/${task.id}`);
    });
    li.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
    li.innerHTML = task.description;
    li.appendChild(button);
    todoListItems.appendChild(li);
}
