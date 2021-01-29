import { AccountInfo } from "@azure/msal-browser";
import { UserInfo, MailInfo } from "./GraphReponseTypes";
import { GRAPH_CONFIG } from "./Constants";

/**
 * Class that handles UI updates for the app.
 */
export class UIManager {
    // Select DOM elements to work with
    static welcomeDiv = document.getElementById("WelcomeMessage");
    static signInButton = document.getElementById("SignIn");
    static cardDiv = document.getElementById("card-div");
    static mailButton = document.getElementById("readMail");
    static profileButton = document.getElementById("seeProfile");
    static profileDiv = document.getElementById("profile-div");
    static tabList = document.getElementById("list-tab");
    static tabContent = document.getElementById("nav-tabContent");

    static showWelcomeMessage(account: AccountInfo) {
        // Reconfiguring DOM elements
        if (UIManager.cardDiv) {
            UIManager.cardDiv.style.display = 'initial';
        }

        if (UIManager.welcomeDiv) {
            UIManager.welcomeDiv.innerHTML = `Welcome ${account.username}`;
        }

        if (UIManager.signInButton) {
            (UIManager.signInButton.nextElementSibling as HTMLElement).style.display = 'none';
            UIManager.signInButton.setAttribute("onclick", "App.signOut();");
            UIManager.signInButton.setAttribute('class', "btn btn-success")
            UIManager.signInButton.innerHTML = "Sign Out";
        }
    }

    static clearTabs() {
        if (UIManager.tabList) {
            UIManager.tabList.innerHTML = '';
        }

        if (UIManager.tabContent) {
            UIManager.tabContent.innerHTML = '';
        }
    }

    static updateUI(data: UserInfo | MailInfo, endpoint: string) {
        console.log(`Graph API responded at: ${new Date().toString()}`);
        if (endpoint === GRAPH_CONFIG.GRAPH_ME_ENDPT) {
            UIManager.setProfile(data as UserInfo);
        } else if (endpoint === GRAPH_CONFIG.GRAPH_MAIL_ENDPT) {
            UIManager.setMail(data as MailInfo);
        }
    }

    static setProfile(data: UserInfo) {
        const userInfo = data as UserInfo;
        const profile = document.createElement("pre");
        profile.innerHTML = JSON.stringify(userInfo, null, 4);
        UIManager.clearTabs();

        if (UIManager.tabContent) {
            UIManager.tabContent.appendChild(profile);
        }
    }

    static setMail(data: MailInfo) {
        const mailInfo = data as MailInfo;
        if (!mailInfo.value || mailInfo.value.length < 1) {
            alert("Your mailbox is empty!")
        } else {
            UIManager.clearTabs();
            mailInfo.value.slice(0, 10).forEach((d: any, i) => {
                    UIManager.createAndAppendListItem(d, i);
                    UIManager.createAndAppendContentItem(d, i);
            });
        }
    }

    static createAndAppendListItem(d: any, i: Number) {
        const listItem = document.createElement("a");
        listItem.setAttribute("class", "list-group-item list-group-item-action")
        listItem.setAttribute("id", "list" + i + "list")
        listItem.setAttribute("data-toggle", "list")
        listItem.setAttribute("href", "#list" + i)
        listItem.setAttribute("role", "tab")
        listItem.setAttribute("aria-controls", `${i}`)
        listItem.innerHTML = d.subject;

        if (UIManager.tabList) {
            UIManager.tabList.appendChild(listItem)
        }
    }

    static createAndAppendContentItem(d: any, i: Number) {
        const contentItem = document.createElement("div");
        contentItem.setAttribute("class", "tab-pane fade")
        contentItem.setAttribute("id", "list" + i)
        contentItem.setAttribute("role", "tabpanel")
        contentItem.setAttribute("aria-labelledby", "list" + i + "list")
        if (d.from) {
            contentItem.innerHTML = "<strong> from: " + d.from.emailAddress.address + "</strong><br><br>" + d.bodyPreview + "...";
            if (UIManager.tabContent) {
                UIManager.tabContent.appendChild(contentItem);
            }
        }
    }
}
