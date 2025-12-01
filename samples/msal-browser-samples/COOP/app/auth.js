// Browser check variables
// If you support IE, our recommendation is that you sign-in using Redirect APIs
// If you as a developer are testing using Edge InPrivate mode, please add "isEdge" to the if check
const ua = window.navigator.userAgent;
const msie = ua.indexOf("MSIE ");
const msie11 = ua.indexOf("Trident/");
const msedge = ua.indexOf("Edge/");
const isIE = msie > 0 || msie11 > 0;
const isEdge = msedge > 0;

let signInType;
let accountId = "";

// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
const myMSALObj = new msal.PublicClientApplication(msalConfig);

myMSALObj.initialize();

function handleResponse(resp) {
    if (resp !== null) {
        accountId = resp.account.homeAccountId;
        myMSALObj.setActiveAccount(resp.account);
        showWelcomeMessage(resp.account);

        if (resp.idToken) {
            // Remove the login button completely
            const loginButton = document.getElementById("loginPopup");
            if (loginButton) {
                loginButton.remove();
            }

            const ssoButton = document.getElementById("sso");
            if (ssoButton) {
                ssoButton.remove();
            }

            // Also display in UI
            const successDiv = document.getElementById("successAuthCode");
            if (successDiv) {
                successDiv.innerHTML = `
                    <div id="successMsg" style="padding: 15px; background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; margin-top: 10px;">
                        <h5 style="color: #155724;">✅ Authentication Successful!</h5>
                        <p><strong>User:</strong> ${resp.account.name || resp.account.username}</p>
                        <p><strong>ID Token:</strong> ${resp.idToken.substring(0, 30)}...</p>
                        <p><strong>Token expires:</strong> ${new Date(resp.expiresOn).toLocaleString()}</p>
                    </div>
                `;
            }
        }
    } else {
        // need to call getAccount here?
        const currentAccounts = myMSALObj.getAllAccounts();
        if (!currentAccounts || currentAccounts.length < 1) {
            return;
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
        } else if (currentAccounts.length === 1) {
            const activeAccount = currentAccounts[0];
            myMSALObj.setActiveAccount(activeAccount);
            accountId = activeAccount.homeAccountId;
            showWelcomeMessage(activeAccount);
        }
    }
}

function signOut(interactionType) {
    const logoutRequest = {
        account: myMSALObj.getAccount({accountId})
    };

    if (interactionType === "popup") {
        myMSALObj.logoutPopup(logoutRequest).then(() => {
            window.location.reload();
        });
    } else {
        myMSALObj.logoutRedirect(logoutRequest);
    }
}

async function loginPopup(request, account) {
    return myMSALObj.acquireTokenPopup(request).then(handleResponse).catch((error) => {
        console.error(error);
    });
}

async function sso(request) {
    return myMSALObj.ssoSilent(request).then(handleResponse).catch((error) => {
        console.error(error);
    });
}
