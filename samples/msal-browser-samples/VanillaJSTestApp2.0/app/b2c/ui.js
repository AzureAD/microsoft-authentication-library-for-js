// Select DOM elements to work with
const welcomeDiv = document.getElementById("WelcomeMessage");
const signInButton = document.getElementById("SignIn");
const cardDiv = document.getElementById("card-div");
const accessTokenButtonRedirect = document.getElementById("getAccessTokenRedirect");
const accessTokenButtonPopup = document.getElementById("getAccessTokenPopup");
const accessTokenButtonSilent = document.getElementById("getAccessTokenSilent");
const profileDiv = document.getElementById("profile-div");

function showWelcomeMessage(account) {
    // Reconfiguring DOM elements
    cardDiv.style.display = 'initial';
    welcomeDiv.innerHTML = `Welcome ${account.name}`;
    signInButton.nextElementSibling.style.display = 'none';
    signInButton.setAttribute("onclick", "signOut();");
    signInButton.setAttribute('class', "btn btn-success")
    signInButton.innerHTML = "Sign Out";
}

function updateUI(response) {
    const oldAccessTokenDiv = document.getElementById('access-token-info');
    if (oldAccessTokenDiv) {
        oldAccessTokenDiv.remove();
    }
    const accessTokenDiv = document.createElement('div');
    accessTokenDiv.id = "access-token-info";
    profileDiv.appendChild(accessTokenDiv);

    const scopes = document.createElement('p');
    scopes.innerHTML = "<strong>Access Token Acquired for Scopes: </strong>" + response.scopes;

    accessTokenDiv.appendChild(scopes);
}