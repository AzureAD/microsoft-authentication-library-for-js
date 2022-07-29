// Select DOM elements to work with
const welcomeDiv = document.getElementById("text");
const redirectBtn = document.getElementById("r_btn");
const ssoBtn = document.getElementById("s_btn");
const profileDiv = document.getElementById("profile-div");

function showWelcomeMessage(account) {
    // Reconfiguring DOM elements
    redirectBtn.innerHTML = '<ion-button id = redirect_o onclick ="onClick(this.id)">Log out with redirect</ion-button>';
    //ssoBtn.style.display = "none";
    ssoBtn.innerHTML = '<ion-button id = seeProfile onclick = "seeProfileRedirect()">See Profile</ion-button>';
    welcomeDiv.innerHTML = `<ion-text><h1>Logged in: ${account.username}</h1></ion-text>`;
}

function showLoggedOutMessage(){
    redirectBtn.innerHTML = '<ion-button id = redirect_i onclick ="onClick(this.id)">Log in with redirect</ion-button>';
    ssoBtn.style.display = null;
    ssoBtn.innerHTML = '<ion-button id = sso_i onclick = "onClick(this.id)">Log in silent</ion-button>';
    welcomeDiv.innerHTML = '<ion-text><h1>Please log in.</h1></ion-text>';
}

function updateUI(data, endpoint) {
    console.log('Graph API responded at: ' + new Date().toString());

    if (endpoint === graphConfig.graphMeEndpoint) {
        const title = document.createElement('p');
        title.innerHTML = "<ion-text>Title: </ion-text>" + data.jobTitle;
        const email = document.createElement('p');
        email.innerHTML = "<ion-text>Mail: </ion-text>" + data.mail;
        const phone = document.createElement('p');
        phone.innerHTML = "<ion-text>Phone: </ion-text>" + data.businessPhones[0];
        const address = document.createElement('p');
        address.innerHTML = "<ion-text>Location: </ion-text>" + data.officeLocation;
        const displayName = document.createElement('p');
        displayName.innerHTML = "<ion-text>Display Name: </ion-text>" + data.displayName;
        //make title + email + phone + address not visible if there is none (e.g. with an MSA acc)
        profileDiv.appendChild(title);
        profileDiv.appendChild(email);
        profileDiv.appendChild(phone);
        profileDiv.appendChild(address);
        profileDiv.appendChild(displayName);
        ssoBtn.style.display = "none";
    }
}
