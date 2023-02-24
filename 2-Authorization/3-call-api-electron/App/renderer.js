// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License

/**
 * The renderer API is exposed by the preload script found in the preload.ts
 * file in order to give the renderer access to the Node API in a secure and 
 * controlled way
 */
const welcomeDiv = document.getElementById('WelcomeMessage');
const signInButton = document.getElementById('signIn');
const signOutButton = document.getElementById('signOut');
const seeProfileButton = document.getElementById('seeProfile');
const cardDiv = document.getElementById('cardDiv');
const profileDiv = document.getElementById('profileDiv');

window.renderer.showWelcomeMessage((event, account) => {
    if (!account) return;

    cardDiv.style.display = 'initial';
    welcomeDiv.innerHTML = `Welcome ${account.name}`;
    signInButton.hidden = true;
    signOutButton.hidden = false;
});

window.renderer.handleProfileData((event, graphResponse) => {
    if (!graphResponse) return;

    console.log(`Graph API responded at: ${new Date().toString()}`);
    setProfile(graphResponse);
});

// UI event handlers
signInButton.addEventListener('click', () => {
    window.renderer.sendLoginMessage();
});

signOutButton.addEventListener('click', () => {
    window.renderer.sendSignoutMessage();
});

seeProfileButton.addEventListener('click', () => {
    window.renderer.sendSeeProfileMessage();
});

const setProfile = (data) => {
    if (!data) return;
    
    profileDiv.innerHTML = '';

    const title = document.createElement('p');
    const email = document.createElement('p');
    const phone = document.createElement('p');
    const address = document.createElement('p');

    title.innerHTML = '<strong>Title: </strong>' + data.jobTitle;
    email.innerHTML = '<strong>Mail: </strong>' + data.mail;
    phone.innerHTML = '<strong>Phone: </strong>' + data.businessPhones[0];
    address.innerHTML = '<strong>Location: </strong>' + data.officeLocation;

    profileDiv.appendChild(title);
    profileDiv.appendChild(email);
    profileDiv.appendChild(phone);
    profileDiv.appendChild(address);
}