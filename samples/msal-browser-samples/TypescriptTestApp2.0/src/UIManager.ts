import { AccountInfo } from "@azure/msal-browser";
import { UserInfo, MailInfo } from "./GraphReponseTypes";
import { GRAPH_CONFIG } from "./Constants";

export class UIManager {
    // Select DOM elements to work with
    static welcomeDiv = document.getElementById("WelcomeMessage");
    static signInButton = document.getElementById("SignIn");
    static cardDiv = document.getElementById("card-div");
    static mailButton = document.getElementById("readMail");
    static profileButton = document.getElementById("seeProfile");
    static profileDiv = document.getElementById("profile-div");

    static showWelcomeMessage(account: AccountInfo) {
        // Reconfiguring DOM elements
        UIManager.cardDiv.style.display = 'initial';
        UIManager.welcomeDiv.innerHTML = `Welcome ${account.username}`;
        (UIManager.signInButton.nextElementSibling as HTMLElement).style.display = 'none';
        UIManager.signInButton.setAttribute("onclick", "signOut();");
        UIManager.signInButton.setAttribute('class', "btn btn-success")
        UIManager.signInButton.innerHTML = "Sign Out";
    }

    static updateUI(data: UserInfo | MailInfo, endpoint: string) {
        console.log(`Graph API responded at: ${new Date().toString()}`);
        if (endpoint === GRAPH_CONFIG.GRAPH_ME_ENDPT) {
            const userInfo = data as UserInfo;
            const title = document.createElement('p');
            title.innerHTML = "<strong>Title: </strong>" + userInfo.jobTitle;
            const email = document.createElement('p');
            email.innerHTML = "<strong>Mail: </strong>" + userInfo.mail;
            const phone = document.createElement('p');
            phone.innerHTML = "<strong>Phone: </strong>" + userInfo.businessPhones[0];
            const address = document.createElement('p');
            address.innerHTML = "<strong>Location: </strong>" + userInfo.officeLocation;
            UIManager.profileDiv.appendChild(title);
            UIManager.profileDiv.appendChild(email);
            UIManager.profileDiv.appendChild(phone);
            UIManager.profileDiv.appendChild(address);
            UIManager.profileButton.style.display = 'none';
        } else if (endpoint === GRAPH_CONFIG.GRAPH_MAIL_ENDPT) {
            const mailInfo = data as MailInfo;
            if (mailInfo.value.length < 1) {
                alert("Your mailbox is empty!")
            } else {
                const tabList = document.getElementById("list-tab");
                const tabContent = document.getElementById("nav-tabContent");
    
                mailInfo.value.map((d: any, i) => {
                    // Keeping it simple
                    if (i < 10) {
                        const listItem = document.createElement("a");
                        listItem.setAttribute("class", "list-group-item list-group-item-action")
                        listItem.setAttribute("id", "list" + i + "list")
                        listItem.setAttribute("data-toggle", "list")
                        listItem.setAttribute("href", "#list" + i)
                        listItem.setAttribute("role", "tab")
                        listItem.setAttribute("aria-controls", `${i}`)
                        listItem.innerHTML = d.subject;
                        tabList.appendChild(listItem)
    
                        const contentItem = document.createElement("div");
                        contentItem.setAttribute("class", "tab-pane fade")
                        contentItem.setAttribute("id", "list" + i)
                        contentItem.setAttribute("role", "tabpanel")
                        contentItem.setAttribute("aria-labelledby", "list" + i + "list")
                        if (d.from) {
                            contentItem.innerHTML = "<strong> from: " + d.from.emailAddress.address + "</strong><br><br>" + d.bodyPreview + "...";
                            tabContent.appendChild(contentItem);
                        }
                    }
                });
            }
            UIManager.mailButton.style.display = 'none';
        }
    }
}
