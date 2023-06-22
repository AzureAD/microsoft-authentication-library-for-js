// Select DOM elements to work with
const welcomeDiv = document.getElementById("WelcomeMessage");
const signInButton = document.getElementById("SignIn");
const cardDiv = document.getElementById("card-div");
const mailButton = document.getElementById("readMail");
const profileButton = document.getElementById("seeProfile");
const profileDiv = document.getElementById("profile-div");
const popTokenAcquired = document.getElementById("SshCertAcquired");

function showWelcomeMessage(account) {
    // Reconfiguring DOM elements
    cardDiv.style.display = 'initial';
    welcomeDiv.innerHTML = `Welcome ${username}`;
    signInButton.nextElementSibling.style.display = 'none';
    signInButton.setAttribute("onclick", "signOut();");
    signInButton.setAttribute('class', "btn btn-success")
    signInButton.innerHTML = "Sign Out";
}

function showSshCertAcquired() {
    const sshCertAcquired = document.createElement('p');
    sshCertAcquired.setAttribute("id", "SshCertAcquired");
    sshCertAcquired.innerHTML = "Successfully acquired SSH Certificate";
    profileDiv.appendChild(sshCertAcquired);
}
