// Select DOM elements to work with
const welcomeDiv = document.getElementById("WelcomeMessage");
const signInButton = document.getElementById("SignIn");
const cardDiv = document.getElementById("card-div");
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

function updateUI(data) {
    const scopes = document.createElement('p');
    scopes.setAttribute("id", "scopes-acquired");
    scopes.innerHTML = "<strong>Access Token Acquired for Scopes: </strong>" + data.scopes.join(" ");
    profileDiv.appendChild(scopes);
}
