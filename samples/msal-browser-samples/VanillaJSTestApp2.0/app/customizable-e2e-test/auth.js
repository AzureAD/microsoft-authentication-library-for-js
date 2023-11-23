let homeAccountId = "";

// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
let myMSALObj, requestConfig, tenantConfig, signInType;

initializeMsal();

async function initializeMsal() {
    return fetch("testConfig.json").then(response => {
        return response.json();
    }).then((authConfig) => {
        myMSALObj = new msal.PublicClientApplication(authConfig.msalConfig);
        requestConfig = authConfig.request;
        tenantConfig = authConfig.tenants;
        myMSALObj.initialize().then(() => {
            setInitializedFlagTrue(); // Used as a flag in the test to ensure that MSAL has been initialized
            myMSALObj.handleRedirectPromise().then(handleResponse).catch(err => {
                console.error(err);
            });
        });
    });
}

function setInitializedFlagTrue() {
    document.getElementById("pca-initialized").innerHTML = "true";
}

function handleResponse(resp) {
    if (resp !== null) {
        homeAccountId = resp.account.homeAccountId;
        showWelcomeMessage(resp.account);
        if (resp.accessToken) {
            updateUI(resp);
        }
        return resp;
    } else {
        // need to call getAccount here?
        const currentAccounts = myMSALObj.getAllAccounts({ isHomeTenant: true });
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

async function signIn(signInType) {
    if (signInType === "popup") {
        return myMSALObj.loginPopup(requestConfig).then(handleResponse).catch(function (error) {
            console.log(error);
        });
    } else if (signInType === "redirect") {
        return myMSALObj.loginRedirect(requestConfig)
    }
}

function signOut(signOutType) {
    const logoutRequest = {
        account: myMSALObj.getAccount({ homeAccountId, isHomeTenant: true } )
    };

    if (signOutType === "popup") {
        myMSALObj.logoutPopup(logoutRequest);
    } else {
        myMSALObj.logoutRedirect(logoutRequest);
    }
}

async function getTokenPopup() {
    const request = requestConfig;
    const currentAcc = myMSALObj.getAccount({ homeAccountId, isHomeTenant: true } );
    if (currentAcc) {
        request.account = currentAcc;
        response = await myMSALObj.acquireTokenPopup(request).then(handleResponse).catch(error => {
            console.error(error);
        });
    }
}

async function getTokenRedirect() {
    const request = requestConfig;
    const currentAcc = myMSALObj.getAccount({ homeAccountId, isHomeTenant: true } );
    if (currentAcc) {
        request.account = currentAcc;
        myMSALObj.acquireTokenRedirect(request);
    }
}

async function getTokenSilently() {
    const request = requestConfig;
    const currentAcc = myMSALObj.getAccount({ homeAccountId, isHomeTenant: true } );
    if (currentAcc) {
        request.account = currentAcc;
        response = await myMSALObj.acquireTokenSilent(request).then(handleResponse).catch(error => {
            console.error(error);
        });
    }
}

async function getGuestTokenSilently() {
    const request = requestConfig;
    if (tenantConfig.guest) {
        const guestAccount = myMSALObj.getAccount({ homeAccountId, tenantId: tenantConfig.guest.tenantId } );
        if (guestAccount) {
            response = await myMSALObj.acquireTokenSilent({ ...request, account: guestAccount }).then(handleResponse).catch(error => {
                console.error(error);
            });
        } else {
            const homeAccount = myMSALObj.getAccount({ homeAccountId, isHomeTenant: true } );
            response = await myMSALObj.acquireTokenSilent({
                 ...request,
                 account: homeAccount,
                 authority: tenantConfig.guest.authority,
                 cacheLookupPolicy: msal.CacheLookupPolicy.RefreshToken
            }).then(handleResponse).catch(error => {
                console.error(error);
            });
        }
    } else {
        console.error("No guest tenant in MSAL Config");
    }
}
