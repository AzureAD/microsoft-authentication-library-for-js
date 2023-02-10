let signInType;
let homeAccountId = "";

// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
let myMSALObj;
let authConfig;
let popToken;
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
            if (authConfig.scenario == "onPageLoad") {
                seeProfile();
            }
        }
    } else {
        // need to call getAccount here?
        const currentAccounts = myMSALObj.getAllAccounts();
        if (!currentAccounts || currentAccounts.length < 1) {
            if (authConfig.scenario == "onPageLoad") {
                signIn("redirect");
            }
            return;
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
        } else if (currentAccounts.length === 1) {
            homeAccountId = currentAccounts[0].homeAccountId;
            showWelcomeMessage(currentAccounts[0]);
        }
    }
}

async function signIn(signInType) {
    if (signInType === "popup") {
        return myMSALObj.loginPopup(authConfig.request).then(handleResponse).catch(function (error) {
            console.log(error);
        });
    } else if (signInType === "redirect") {
        return myMSALObj.loginRedirect(authConfig.request)
    }
}

function signOut(signOutType) {
    const logoutRequest = {
        account: myMSALObj.getAccountByHomeId(homeAccountId)
    };

    if (signOutType === "popup") {
        myMSALObj.logoutPopup(logoutRequest);
    } else {
        myMSALObj.logoutRedirect(logoutRequest);
    }
}

async function getTokenPopup(customRequest) {
    const request = customRequest || authConfig.request;
    const currentAcc = myMSALObj.getAccountByHomeId(homeAccountId);
    if (currentAcc) {
        request.account = currentAcc;
        response = await myMSALObj.acquireTokenPopup(request).then(handleResponse).catch(error => {
            console.error(error);
        });
        return response;
    }
}

async function getTokenRedirect(customRequest) {
    const request = customRequest || authConfig.request;
    const currentAcc = myMSALObj.getAccountByHomeId(homeAccountId);
    if (currentAcc) {
        request.account = currentAcc;
        myMSALObj.acquireTokenRedirect(request);
    }
}

async function getTokenSilently(customRequest) {
    const request = customRequest || authConfig.request;
    const currentAcc = myMSALObj.getAccountByHomeId(homeAccountId);
    if (currentAcc) {
        request.account = currentAcc;
        response = await myMSALObj.acquireTokenSilent(request).then(handleResponse).catch(error => {
            console.error(error);
        });
    }
}

async function seeProfile(pop) {
    const requestParameters = pop ? {
        ...authConfig.request.tokenRequest,
        authenticationScheme: "pop",
        resourceRequestMethod: "GET",
        resourceRequestUri: authConfig.apiConfig.graphMeEndpoint
    } : authConfig.request.tokenRequest;

    const response = await myMSALObj.acquireTokenPopup(requestParameters).catch(error => {
        console.log(error);
    });

    callMSGraph(authConfig.apiConfig.graphMeEndpoint, response.accessToken, updateInfo);
    profileButton.style.display = 'none';
}

async function getSecondToken() {
    await getTokenPopup(authConfig.request.secondTokenRequest).catch(error => {
        console.log(error);
    });
    updateInfo("Second Token Acquired", "")
    secondTokenButton.style.display = 'none';
}

async function fetchPopToken() {
    const response = await myMSALObj.acquireTokenPopup(authConfig.request.popTokenRequest).catch(error => {
        console.log(error);
    });

    popToken = response.accessToken

    if (popToken) {
        showPopTokenAcquired(popToken);
    }
}
