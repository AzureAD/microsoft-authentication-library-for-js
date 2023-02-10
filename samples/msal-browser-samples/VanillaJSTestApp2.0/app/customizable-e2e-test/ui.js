// Select DOM elements to work with
const welcomeDiv = document.getElementById("WelcomeMessage");
const signInButton = document.getElementById("SignIn");
const popupButton = document.getElementById("popup");
const redirectButton = document.getElementById("redirect");
const cardDiv = document.getElementById("card-div");
const profileDiv = document.getElementById("profile-div");
const secondTokenButton = document.getElementById("secondToken");
const infoDiv = document.getElementById("info-div");
const popCardDiv = document.getElementById("pop-card-div");
const profileButton = document.getElementById("seeProfile");
const popTokenAcquired = document.getElementById("PopTokenAcquired");
const jwtBodyView = document.getElementById("jwtBodyView");
const jwtHeaderView = document.getElementById("jwtHeaderView");

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

function updateInfo(data, endpoint) {
    console.log('Graph API responded at: ' + new Date().toString());

    if (endpoint === authConfig.apiConfig.graphMeEndpoint) {
        const title = document.createElement('p');
        title.innerHTML = "<strong>Title: </strong>" + data.jobTitle;
        const email = document.createElement('p');
        email.innerHTML = "<strong>Mail: </strong>" + data.mail;
        const phone = document.createElement('p');
        phone.innerHTML = "<strong>Phone: </strong>" + data.businessPhones[0];
        const address = document.createElement('p');
        address.innerHTML = "<strong>Location: </strong>" + data.officeLocation;
        infoDiv.appendChild(title);
        infoDiv.appendChild(email);
        infoDiv.appendChild(phone);
        infoDiv.appendChild(address);
    } else {
        const secondDiv = document.createElement('div');
        secondDiv.id = "second-resource-div";
        const cardBody = document.getElementsByClassName("card-body")[0]
        cardBody.appendChild(secondDiv);
        const title = document.createElement('p');
        title.innerHTML = data;
        secondDiv.appendChild(title);
    }
}

function showPopTokenAcquired(encodedJwt) {
    popCardDiv.style.display = 'initial';
    const popTokenAcquired = document.createElement('p');
    popTokenAcquired.setAttribute("id", "PopTokenAcquired");
    popTokenAcquired.innerHTML = "Successfully acquired PoP Token";
    profileDiv.appendChild(popTokenAcquired);

    const splitJwt = encodedJwt.split(".");
    const jwtHeader = JSON.stringify(JSON.parse(atob(splitJwt[0])), null, 4);
    const jwtBody = JSON.stringify(JSON.parse(atob(splitJwt[1])), null, 4);
    jwtBodyView.style = "white-space: pre-wrap";
    jwtHeaderView.textContent = jwtHeader;
    jwtBodyView.textContent = jwtBody;
}
