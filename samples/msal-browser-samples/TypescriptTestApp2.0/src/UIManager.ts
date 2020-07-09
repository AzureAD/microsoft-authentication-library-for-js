import { AccountInfo } from "@azure/msal-browser";

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

    static updateUI(data: any, endpoint: string) {
        console.log(`Graph API responded at: ${new Date().toString()}`);
        console.log(`Graph endpoint: ${endpoint}`);
        console.log(`Response data: ${data}`);
        // if (endpoint === graphConfig.graphMeEndpoint) {
        //     const title = document.createElement('p');
        //     title.innerHTML = "<strong>Title: </strong>" + data.jobTitle;
        //     const email = document.createElement('p');
        //     email.innerHTML = "<strong>Mail: </strong>" + data.mail;
        //     const phone = document.createElement('p');
        //     phone.innerHTML = "<strong>Phone: </strong>" + data.businessPhones[0];
        //     const address = document.createElement('p');
        //     address.innerHTML = "<strong>Location: </strong>" + data.officeLocation;
        //     UIManager.profileDiv.appendChild(title);
        //     UIManager.profileDiv.appendChild(email);
        //     UIManager.profileDiv.appendChild(phone);
        //     UIManager.profileDiv.appendChild(address);
        // } else if (endpoint === graphConfig.graphMailEndpoint) {
        //     if (data.value.length < 1) {
        //         alert("Your mailbox is empty!")
        //     } else {
        //         const tabList = document.getElementById("list-tab");
        //         const tabContent = document.getElementById("nav-tabContent");
    
        //         data.value.map((d: any, i) => {
        //             // Keeping it simple
        //             if (i < 10) {
        //                 const listItem = document.createElement("a");
        //                 listItem.setAttribute("class", "list-group-item list-group-item-action")
        //                 listItem.setAttribute("id", "list" + i + "list")
        //                 listItem.setAttribute("data-toggle", "list")
        //                 listItem.setAttribute("href", "#list" + i)
        //                 listItem.setAttribute("role", "tab")
        //                 listItem.setAttribute("aria-controls", i)
        //                 listItem.innerHTML = d.subject;
        //                 tabList.appendChild(listItem)
    
        //                 const contentItem = document.createElement("div");
        //                 contentItem.setAttribute("class", "tab-pane fade")
        //                 contentItem.setAttribute("id", "list" + i)
        //                 contentItem.setAttribute("role", "tabpanel")
        //                 contentItem.setAttribute("aria-labelledby", "list" + i + "list")
        //                 contentItem.innerHTML = "<strong> from: " + d.from.emailAddress.address + "</strong><br><br>" + d.bodyPreview + "...";
        //                 tabContent.appendChild(contentItem);
        //             }
        //         });
        //     }
        // }
    }
}
