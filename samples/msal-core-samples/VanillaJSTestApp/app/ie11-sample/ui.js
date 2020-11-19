// Select DOM elements to work with
var welcomeDiv = document.getElementById("WelcomeMessage");
var signInButton = document.getElementById("SignIn");
var cardDiv = document.getElementById("card-div");
var profileButton = document.getElementById("seeProfile");
var profileDiv = document.getElementById("profile-div");

function showWelcomeMessage(account) {
    // Reconfiguring DOM elements
    cardDiv.setAttribute('style', 'display:initial');
    welcomeDiv.innerHTML = 'Welcome ' + account.userName;
    signInButton.setAttribute("onclick", "signOut();");
    signInButton.setAttribute('class', "btn btn-success")
    signInButton.innerHTML = "Sign Out";
}

function updateUI(data) {
    console.log('Graph API responded at: ' + new Date().toString());

    var title = document.createElement('p');
    title.innerHTML = "<strong>Title: </strong>" + data.jobTitle;
    var email = document.createElement('p');
    email.innerHTML = "<strong>Mail: </strong>" + data.mail;
    var phone = document.createElement('p');
    phone.innerHTML = "<strong>Phone: </strong>" + data.businessPhones[0];
    var address = document.createElement('p');
    address.innerHTML = "<strong>Location: </strong>" + data.officeLocation;
    profileDiv.appendChild(title);
    profileDiv.appendChild(email);
    profileDiv.appendChild(phone);
    profileDiv.appendChild(address);
}
