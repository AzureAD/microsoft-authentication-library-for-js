let signInType;
let homeAccountId = "";

// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
let myMSALObj;
let authConfig;
initializeMsal();

async function initializeMsal() {
    return fetch("testConfig.json").then(response => {
        return response.json();
    }).then(json => {
        authConfig = json;
        myMSALObj = new msal.PublicClientApplication(json.msalConfig);
        myMSALObj.handleRedirectPromise().then(handleResponse).catch(err => {
            console.error(err);
    });
    });
}

function handleResponse(resp) {
    if (resp !== null) {
        homeAccountId = resp.account.homeAccountId;
        showWelcomeMessage(resp.account);
        if (resp.accessToken) {
            updateUI(resp);
        }
    } else {
        // need to call getAccount here?
        const currentAccounts = myMSALObj.getAllAccounts();
        if (currentAccounts === null) {
            return;
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
        } else if (currentAccounts.length === 1) {
            homeAccountId = currentAccounts[0].homeAccountId;
            showWelcomeMessage(currentAccounts[0]);
        }
    }
}

async function signIn(method) {
    signInType = method;
    if (signInType === "loginPopup") {
        return myMSALObj.loginPopup(authConfig.request).then(handleResponse).catch(function (error) {
            console.log(error);
        });
    } else if (signInType === "loginRedirect") {
        return myMSALObj.loginRedirect(authConfig.request)
    }
}

function signOut() {
    const logoutRequest = {
        account: myMSALObj.getAccountByHomeId(homeAccountId)
    };

    myMSALObj.logout(logoutRequest);
}

async function getTokenPopup() {
    const request = authConfig.request;
    const currentAcc = myMSALObj.getAccountByHomeId(homeAccountId);
    if (currentAcc) {
        request.account = currentAcc;
        response = await myMSALObj.acquireTokenPopup(request).then(handleResponse).catch(error => {
            console.error(error);
        });
    }
}

async function getTokenRedirect() {
    const request = authConfig.request;
    const currentAcc = myMSALObj.getAccountByHomeId(homeAccountId);
    if (currentAcc) {
        request.account = currentAcc;
        myMSALObj.acquireTokenRedirect(request);
    }
}

async function getTokenSilently() {
    const request = authConfig.request;
    const currentAcc = myMSALObj.getAccountByHomeId(homeAccountId);
    if (currentAcc) {
        request.account = currentAcc;
        response = await myMSALObj.acquireTokenSilent(request).then(handleResponse).catch(error => {
            console.error(error);
        });
    }
}
