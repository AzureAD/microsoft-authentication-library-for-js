// Select DOM elements to work with
const signInButton = document.getElementById('signIn');
const signOutButton = document.getElementById('signOut');
const titleDiv = document.getElementById('title-div');
const welcomeDiv = document.getElementById('welcome-div');
const tableDiv = document.getElementById('table-div');
const tableBody = document.getElementById('table-body-div');

function welcomeUser(username) {
    signInButton.classList.add('d-none');
    signOutButton.classList.remove('d-none');
    titleDiv.classList.add('d-none');
    welcomeDiv.classList.remove('d-none');
    welcomeDiv.innerHTML = `Welcome ${username}!`;
};

function updateTable() {
    /**
     * In order to obtain the ID Token in the cached obtained previously, you can initiate a
     * silent token request by passing the current user's account and the scope "openid".
     */
    myMSALObj.acquireTokenSilent({
            account: myMSALObj.getAccountByUsername(username),
            scopes: [],
        })
        .then((response) => {
            tableDiv.classList.remove('d-none');

            const tokenClaims = createClaimsTable(response.idTokenClaims);

            Object.keys(tokenClaims).forEach((key) => {
                let row = tableBody.insertRow(0);
                let cell1 = row.insertCell(0);
                let cell2 = row.insertCell(1);
                let cell3 = row.insertCell(2);
                cell1.innerHTML = tokenClaims[key][0];
                cell2.innerHTML = tokenClaims[key][1];
                cell3.innerHTML = tokenClaims[key][2];
            });
        });
};
