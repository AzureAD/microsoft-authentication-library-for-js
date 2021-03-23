/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { AccountInfo } from "@azure/msal-node";
import { UserInfo, MailInfo } from "./GraphReponseTypes";
import { GRAPH_CONFIG } from "./Constants";

/**
 * Class that handles UI updates for the app.
 */
export class UIManager {
    // Select DOM elements to work with
    private welcomeDiv: HTMLElement;
    private signInButton: HTMLElement;
    private signOutButton: HTMLElement;
    private cardDiv: HTMLElement;
    private mailButton: HTMLElement; 
    private profileButton: HTMLElement;
    private profileDiv: HTMLElement;
    private tabList: HTMLElement;
    private tabContent: HTMLElement;

    constructor() {
        this.welcomeDiv = document.getElementById("WelcomeMessage");
        this.signInButton = document.getElementById("SignIn");
        this.signOutButton = document.getElementById("SignOut");
        this.cardDiv = document.getElementById("card-div");
        this.mailButton = document.getElementById("readMail");
        this.profileButton = document.getElementById("seeProfile");
        this.profileDiv = document.getElementById("profile-div");
        this.tabList = document.getElementById("list-tab");
        this.tabContent = document.getElementById("nav-tabContent");
    }

    public showWelcomeMessage(account: AccountInfo) {
        // Reconfiguring DOM elements
        this.cardDiv.style.display = 'initial';
        this.welcomeDiv.innerHTML = `Welcome ${account.username}`;
        this.signInButton.hidden = true;
        this.signOutButton.hidden = false;
    }

    public clearTabs() {
        this.tabList.innerHTML = '';
        this.tabContent.innerHTML = '';
    }

    public updateUI(data: UserInfo | MailInfo, endpoint: string) {
        console.log(`Graph API responded at: ${new Date().toString()}`);
        if (endpoint === GRAPH_CONFIG.GRAPH_ME_ENDPT) {
            this.setProfile(data as UserInfo);
        } else if (endpoint === GRAPH_CONFIG.GRAPH_MAIL_ENDPT) {
            this.setMail(data as MailInfo);
        }
    }

    public setProfile(data: UserInfo) {
        const userInfo = data as UserInfo;
        const profile = document.createElement("pre");
        profile.innerHTML = JSON.stringify(userInfo, null, 4);
        this.clearTabs();
        this.tabContent.appendChild(profile);
    }

    public setMail(data: MailInfo) {
        const mailInfo = data as MailInfo;
        if (mailInfo.value.length < 1) {
            alert("Your mailbox is empty!")
        } else {
            this.clearTabs();
            mailInfo.value.slice(0, 10).forEach((d: any, i) => {
                    this.createAndAppendListItem(d, i);
                    this.createAndAppendContentItem(d, i);
            });
        }
    }

    public createAndAppendListItem(d: any, i: Number) {
        const listItem = document.createElement("a");
        listItem.setAttribute("class", "list-group-item list-group-item-action")
        listItem.setAttribute("id", "list" + i + "list")
        listItem.setAttribute("data-toggle", "list")
        listItem.setAttribute("href", "#list" + i)
        listItem.setAttribute("role", "tab")
        listItem.setAttribute("aria-controls", `${i}`)
        listItem.innerHTML = d.subject;
        this.tabList.appendChild(listItem)
    }

    public createAndAppendContentItem(d: any, i: Number) {
        const contentItem = document.createElement("div");
        contentItem.setAttribute("class", "tab-pane fade")
        contentItem.setAttribute("id", "list" + i)
        contentItem.setAttribute("role", "tabpanel")
        contentItem.setAttribute("aria-labelledby", "list" + i + "list")
        if (d.from) {
            contentItem.innerHTML = "<strong> from: " + d.from.emailAddress.address + "</strong><br><br>" + d.bodyPreview + "...";
            this.tabContent.appendChild(contentItem);
        }
    }
}
