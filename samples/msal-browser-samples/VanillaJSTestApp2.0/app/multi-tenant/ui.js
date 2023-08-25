// Select DOM elements to work with
const welcomeDiv = document.getElementById("WelcomeMessage");
const pickProfileMessage = document.getElementById("PickProfileMessage");
const signInDiv = document.getElementById("sign-in-div");
const signOutDiv = document.getElementById("sign-out-div");
const signInButton = document.getElementById("SignIn");
const signOutButton = document.getElementById("SignOut");
const popupButton = document.getElementById("popup");
const redirectButton = document.getElementById("redirect");
const cardDivTenantProfiles = document.getElementById("card-div-profiles");
const cardDivGraphProfiles = document.getElementById("card-div-graph");
const mailButton = document.getElementById("readMail");
const profileButton = document.getElementById("seeProfile");
const guestProfileButton = document.getElementById("seeProfileGuest");
const tenantProfileDiv = document.getElementById("tenant-profile-div");
const graphProfileDiv = document.getElementById("graph-profile-div");

function showWelcomeMessage(homeAccount) {
    // Reconfiguring DOM elements
    cardDivGraphProfiles.style.display = 'initial';
    welcomeDiv.innerHTML = `Welcome ${homeAccount.username}`;
    signInButton.setAttribute('class', "btn btn-success dropdown-toggle");
    signInButton.innerHTML = "Sign Out";
    popupButton.setAttribute('onClick', "signOut(this.id)");
    popupButton.innerHTML = "Sign Out with Popup";
    redirectButton.setAttribute('onClick', "signOut(this.id)");
    redirectButton.innerHTML = "Sign Out with Redirect";
}

function createTenantProfileButton(tenantProfile, activeTenantId) {
    const tenantIdButton = document.createElement('button');
    const styleClass = (tenantProfile.tenantId === activeTenantId) ? "btn btn-success" : "btn btn-primary";
    tenantIdButton.setAttribute('class', styleClass);
    tenantIdButton.setAttribute('id', tenantProfile.tenantId);
    tenantIdButton.setAttribute('onClick', "setActiveAccount(this.id)");
    const label = `${tenantProfile.tenantId}${ tenantProfile.isHomeTenant ? " (Home Tenant)" : "" }`;
    tenantIdButton.innerHTML = label;
    return tenantIdButton;
}

function showTenantProfilePicker(tenantProfiles, activeAccount) {
    // Reconfiguring DOM elements
    cardDivTenantProfiles.style.display = 'initial';
    pickProfileMessage.innerHTML = "Select a tenant profile to set as the active account";
    tenantProfileDiv.innerHTML = "";
    const sortedTenantProfiles = tenantProfiles.sort((profile) => { return profile.isHomeTenant ? -1 : 1;})
    sortedTenantProfiles.forEach(function (profile) {
        tenantProfileDiv.appendChild(createTenantProfileButton(profile, activeAccount.tenantId));
        tenantProfileDiv.appendChild(document.createElement('br'));
        tenantProfileDiv.appendChild(document.createElement('br'));
    });
    const newTenantProfileButton = document.createElement('button');
    newTenantProfileButton.setAttribute('class', "btn btn-primary");
    newTenantProfileButton.setAttribute('id', "new-tenant-button");
    newTenantProfileButton.setAttribute('onClick', "requestGuestToken()");
    newTenantProfileButton.innerHTML = "Add New Tenant Profile";
    tenantProfileDiv.appendChild(newTenantProfileButton);
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
        graphProfileDiv.innerHTML = "";
        graphProfileDiv.appendChild(title);
        graphProfileDiv.appendChild(email);
        graphProfileDiv.appendChild(phone);
        graphProfileDiv.appendChild(address);
    }
}
