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

myMSALObj.initialize().then(() => {
        // Redirect: once login is successful and redirects with tokens, call Graph API
        myMSALObj.handleRedirectPromise().then(handleResponse).catch(err => {
        console.error(err);
    });
    enableSigninButton();
});

function handleResponse(resp) {
    if (resp !== null) {
        accountId = resp.account.homeAccountId;
        myMSALObj.setActiveAccount(resp.account);
        showWelcomeMessage(resp.account);
        updateResponseProperties(resp);
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

async function signIn(signInType) {
    if (signInType === "popup") {
        return myMSALObj.loginPopup(loginRequest).then((response) => {
            return handleResponse(response);
        }).catch(function (error) {
            console.log(error);
        });
    } else if (signInType === "redirect") {
        return myMSALObj.loginRedirect(loginRequest).then((response) => {
            return handleResponse(response);
        }).catch(function (error) {
            console.log(error);
        });;
    } else if (signInType === "ssosilent") {
        return myMSALObj.ssoSilent(loginRequest).then((response) => {
            handleResponse(response);
        }).catch(function (error) {
            console.log(error);
        });;
    }
}

function signOut(interactionType) {
    const logoutRequest = {
        account: myMSALObj.getAccountByHomeId(accountId)
    };

    if (interactionType === "popup") {
        myMSALObj.logoutPopup(logoutRequest).then(() => {
            window.location.reload();
        });
    } else {
        myMSALObj.logoutRedirect(logoutRequest);
    }
}

async function getToken(method) {
    // Add here scopes for access token to be used at MS Graph API endpoints.
    const request = {
        scopes: ["User.Read"]
    }
    if(method === "popup") {
        console.log("acquiring token using popup");
        return myMSALObj.acquireTokenPopup(request).then((response) => {
            handleResponse(response);
        }).catch(error => {
            console.error(error);
        });
    } else if(method == "redirect") {
        console.log("acquiring token using redirect");
        return myMSALObj.acquireTokenRedirect(request);
    } else if(method == "silent") {
        console.log("acquiring token silently");
        return myMSALObj.acquireTokenSilent(request).then((response) => {
            handleResponse(response);
        }).catch(error => {
            console.error(error);
        });
    }
}