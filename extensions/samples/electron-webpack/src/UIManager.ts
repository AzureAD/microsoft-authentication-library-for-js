/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "@azure/msal-node";

/**
 * Class that handles UI updates for the app.
 */
export class UIManager {
    // Select DOM elements to work with
    private welcomeDiv: HTMLElement;
    private signInButton: HTMLElement;
    private signOutButton: HTMLElement;
    private cardDiv: HTMLElement;
   
    constructor() {
        this.welcomeDiv = document.getElementById("WelcomeMessage");
        this.signInButton = document.getElementById("SignIn");
        this.signOutButton = document.getElementById("SignOut");
        this.cardDiv = document.getElementById("card-div");
    }

    public showWelcomeMessage(account: AccountInfo) {
        // Reconfiguring DOM elements
        this.cardDiv.style.display = "initial";
        this.welcomeDiv.innerHTML = `Welcome ${account.username}`;
        this.signInButton.hidden = true;
        this.signOutButton.hidden = false;
    }

}