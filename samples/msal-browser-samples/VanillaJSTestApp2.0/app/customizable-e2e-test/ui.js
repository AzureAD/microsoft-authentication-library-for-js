// Select DOM elements to work with
const welcomeDiv = document.getElementById("WelcomeMessage");
const signInButton = document.getElementById("SignIn");
const popupButton = document.getElementById("popup");
const redirectButton = document.getElementById("redirect");
const cardDiv = document.getElementById("card-div");
const profileDiv = document.getElementById("profile-div");

function showWelcomeMessage(account) {
    // Reconfiguring DOM elements
    cardDiv.style.display = 'initial';
    welcomeDiv.innerHTML = `Welcome ${account.name}`;
    signInButton.setAttribute('class', "btn btn-success dropdown-toggle");
    signInButton.innerHTML = "Sign Out";
    popupButton.setAttribute('onClick', "signOut(this.id)");
    popupButton.innerHTML = "Sign Out with Popup";
    redirectButton.setAttribute('onClick', "signOut(this.id)");
    redirectButton.innerHTML = "Sign Out with Redirect";
}

function updateUI(data) {
    const scopes = document.createElement('p');
    scopes.setAttribute("id", "scopes-acquired");
    scopes.innerHTML = "<strong>Access Token Acquired for Scopes: </strong>" + data.scopes.join(" ");
    profileDiv.appendChild(scopes);
}
