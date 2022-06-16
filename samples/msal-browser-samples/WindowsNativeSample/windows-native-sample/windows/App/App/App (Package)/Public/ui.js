// Select DOM elements to work with
const welcomeDiv = document.getElementById("text");
const redirectBtn = document.getElementById("r_btn");
const popupBtn = document.getElementById("p_btn");

function showWelcomeMessage(account) {
    // Reconfiguring DOM elements
    redirectBtn.innerHTML = '<ion-button id = redirect_o onclick ="onClick(this.id)">Log out with redirect</ion-button>';
    popupBtn.innerHTML = '<ion-button id = popup_o onclick ="onClick(this.id)">Log out with popup</ion-button>';
    welcomeDiv.innerHTML = `<ion-text><h1>Logged in: ${account.username}</h1></ion-text>`;
}

function showLoggedOutMessage(){
    redirectBtn.innerHTML = '<ion-button id = redirect_i onclick ="onClick(this.id)">Log in with redirect</ion-button>';
    popupBtn.innerHTML = '<ion-button id = popup_i onclick ="onClick(this.id)">Log in with popup</ion-button>';
    welcomeDiv.innerHTML = '<ion-text><h1>Please log in.</h1></ion-text>';
}