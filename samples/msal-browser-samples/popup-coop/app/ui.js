// Select DOM elements to work with
window.name = "MSAL JS App Window";
const welcomeDiv = document.getElementById("WelcomeMessage");
const signInButton = document.getElementById("SignIn");
const popupButton = document.getElementById("popup");
const redirectButton = document.getElementById("redirect");
const cardDiv = document.getElementById("card-div");
const mailButton = document.getElementById("readMail");
const profileButton = document.getElementById("seeProfile");
const profileDiv = document.getElementById("profile-div");
const broadcastchannel = new BroadcastChannel('sts-channel');

function showWelcomeMessage(account) {
    // Reconfiguring DOM elements
    cardDiv.style.display = 'initial';
    welcomeDiv.innerHTML = `Welcome ${account.username}`;
    signInButton.setAttribute('class', "btn btn-success dropdown-toggle");
    signInButton.innerHTML = "Sign Out";
    popupButton.setAttribute('onClick', "signOut(this.id)");
    popupButton.innerHTML = "Sign Out with Popup";
    redirectButton.setAttribute('onClick', "signOut(this.id)");
    redirectButton.innerHTML = "Sign Out with Redirect";
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
    } else if (endpoint === graphConfig.graphMailEndpoint) {
        if (data.value.length < 1) {
            alert("Your mailbox is empty!")
        } else {
            const tabList = document.getElementById("list-tab");
            const tabContent = document.getElementById("nav-tabContent");

            data.value.map((d, i) => {
                // Keeping it simple
                if (i < 10) {
                    const listItem = document.createElement("a");
                    listItem.setAttribute("class", "list-group-item list-group-item-action")
                    listItem.setAttribute("id", "list" + i + "list")
                    listItem.setAttribute("data-toggle", "list")
                    listItem.setAttribute("href", "#list" + i)
                    listItem.setAttribute("role", "tab")
                    listItem.setAttribute("aria-controls", i)
                    listItem.innerHTML = d.subject;
                    tabList.appendChild(listItem)

                    const contentItem = document.createElement("div");
                    contentItem.setAttribute("class", "tab-pane fade")
                    contentItem.setAttribute("id", "list" + i)
                    contentItem.setAttribute("role", "tabpanel")
                    contentItem.setAttribute("aria-labelledby", "list" + i + "list")
                    contentItem.innerHTML = "<strong> from: " + d.from.emailAddress.address + "</strong><br><br>" + d.bodyPreview + "...";
                    tabContent.appendChild(contentItem);
                }
            });
        }
    }
}

//Solution 3: Open STS in iframe and trigger popup
function openStsIframeBtn() {
    var iframe = document.getElementById("stsIframe");
    iframe.src = "https://localhost:30663";
    iframe.style.display = "block";

    // Listen for messages from the iframe
    window.addEventListener("message", (event) => {
        // For security reasons, check the origin of the message
        if (event.origin !== "http://localhost:30663") {
            console.warn("MSAL JS: Origin not allowed:", event.origin);
            return;
        }
        console.log("MSAL JS: Message received from iframe:", event.data);
    });
}
//end of Solution 3

//Solution 2: Open STS in popup and redirect back to MSAL JS
function openStsPopup() {
    console.log("MSAL JS: Opening STS Popup");
    const stsPopupWindow = window.open("https://localhost:30663", "STS Popup", "width=600,height=600,'noopener'");
    console.log("MSAL JS: stsPopupWindow", stsPopupWindow);
    
    // Check if popup was closed by user
    if (stsPopupWindow) {
        const checkClosed = setInterval(() => {
            if (stsPopupWindow.closed) {
                clearInterval(checkClosed);
                console.log("MSAL JS: Popup was closed by user");
                // Handle popup closure here (e.g., show a message, reset UI state, etc.)
            }
        }, 1000); // Check every second
    }
    
    // Listen for messages from the popup
    // window.addEventListener("message", (event) => {
    //     // For security reasons, check the origin of the message
    //     if (event.origin !== "https://localhost:30663") {
    //         console.warn("MSAL JS: Origin not allowed:", event.origin);
    //         return;
    //     }
    //     console.log("MSAL JS: Message received from popup:", event.data);
    // });
}

function onLoad() {
    console.log("MSAL JS: onLoad called");

    const url = window.location.href;
    if (url.includes("code")) {
        console.log("MSAL JS: Authorization code received in URL");
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get("code");
        console.log("MSAL JS: Authorization code:", authCode);
        document.getElementById("successAuthCode").innerText = "Authorization code received: " + authCode;

        if (authCode) {
            broadcastchannel.postMessage({ text: authCode });
            window.close();
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    onLoad();
});
//end of Solution 2