// Select DOM elements to work with
const signInButton = document.getElementById("SignIn");
const popupButton = document.getElementById("popup");
const redirectButton = document.getElementById("redirect");
const cardDiv = document.getElementById("card-div");

function showWelcomeMessage(account) {
    // Reconfiguring DOM elements
    signInButton.setAttribute('class', "btn btn-success dropdown-toggle");
    signInButton.innerHTML = "Sign Out";
    popupButton.setAttribute('onClick', "signOut(this.id)");
    popupButton.innerHTML = "Sign Out with Popup";
    redirectButton.setAttribute('onClick', "signOut(this.id)");
    redirectButton.innerHTML = "Sign Out with Redirect";
}

// onLoad is now only called from redirect.html, not from the main page
// Removed DOMContentLoaded listener to prevent running on main page

