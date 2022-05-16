// Select DOM elements to work with
const welcomeDiv = document.getElementById("WelcomeMessage");
const signInButton = document.getElementById("SignIn");
const cardDiv = document.getElementById("card-div");
const mailButton = document.getElementById("readMail");
const profileButton = document.getElementById("seeProfile");
const profileDiv = document.getElementById("profile-div");
const popTokenAcquired = document.getElementById("PopTokenAcquired");

function showWelcomeMessage(account) {
    // Reconfiguring DOM elements
    cardDiv.style.display = 'initial';
    welcomeDiv.innerHTML = `Welcome ${username}`;
    signInButton.nextElementSibling.style.display = 'none';
    signInButton.setAttribute("onclick", "signOut();");
    signInButton.setAttribute('class', "btn btn-success")
    signInButton.innerHTML = "Sign Out";
}

function showPopTokenAcquired(encodedJwt) {
    const popTokenAcquired = document.createElement('p');
    popTokenAcquired.setAttribute("id", "PopTokenAcquired");
    popTokenAcquired.innerHTML = "Successfully acquired PoP Token";
    profileDiv.appendChild(popTokenAcquired);

    const jwtWindow = document.getElementById("jwtWindow");
    const jwtHeaderView = document.createElement('pre');
    const jwtBodyView = document.createElement('pre');
    const splitJwt = encodedJwt.split(".");
    const jwtHeader = JSON.stringify(JSON.parse(atob(splitJwt[0])), null, 4);
    const jwtBody = JSON.stringify(JSON.parse(atob(splitJwt[1])), null, 4);
    jwtHeaderView.textContent = jwtHeader;
    jwtBodyView.textContent = jwtBody;
    jwtWindow.appendChild(jwtHeaderView);
    jwtWindow.appendChild(jwtBodyView)
}

function updateUI(data, endpoint) {
    console.log('Graph API responded at: ' + new Date().toString());

    if (endpoint === graphConfig.graphMeEndpoint) {
        const title = document.createElement('p');
        title.innerHTML = "<strong>Title: </strong>" + data.jobTitle;
        const email = document.createElement('p');
        email.innerHTML = "<strong>Mail: </strong>" + data.mail;
        const phone = document.createElement('p');
        phone.innerHTML = "<strong>Phone: </strong>" + data.businessPhones[0];
        const address = document.createElement('p');
        address.innerHTML = "<strong>Location: </strong>" + data.officeLocation;
        profileDiv.appendChild(title);
        profileDiv.appendChild(email);
        profileDiv.appendChild(phone);
        profileDiv.appendChild(address);
    } 
}
