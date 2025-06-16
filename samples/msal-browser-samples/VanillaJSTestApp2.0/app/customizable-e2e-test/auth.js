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

            myMSALObj.enableAccountStorageEvents();
            myMSALObj.addEventCallback((event) => {
                if (event.eventType === msal.EventType.ACTIVE_ACCOUNT_CHANGED) {
                    showWelcomeMessage(myMSALObj.getActiveAccount());
                }
            })
        });
    });
}

function setInitializedFlagTrue() {
    document.getElementById("pca-initialized").innerHTML = "true";
}

function handleResponse(resp) {
    let activeAccount;
    if (resp !== null) {
        activeAccount = resp.account;
        myMSALObj.setActiveAccount(activeAccount);
        showWelcomeMessage(activeAccount);
        if (resp.accessToken) {
            updateUI(resp);
        }
    } else {
        activeAccount = myMSALObj.getActiveAccount();
        if(!activeAccount) {
            const currentAccounts = myMSALObj.getAllAccounts();
            if (currentAccounts.length === 0) {
                return;
            } else if (currentAccounts.length > 1) {
                activeAccount = currentAccounts.sort((account) => {
                    return account.tenantId === account.homeAccountId.split(".")[1] ? -1 : 1; 
                })[0];
            } else if (currentAccounts.length === 1) {
                activeAccount = currentAccounts[0];

            }    
        }
        
        myMSALObj.setActiveAccount(activeAccount);
        showWelcomeMessage(activeAccount);
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
        account: myMSALObj.getActiveAccount()
    };

    if (signOutType === "popup") {
        myMSALObj.logoutPopup(logoutRequest);
    } else {
        myMSALObj.logoutRedirect(logoutRequest);
    }
}

async function getTokenPopup() {
    const request = requestConfig;
    const currentAcc = myMSALObj.getActiveAccount();
    if (currentAcc) {
        request.account = currentAcc;
        response = await myMSALObj.acquireTokenPopup(request).then(handleResponse).catch(error => {
            console.error(error);
        });
    }
}

async function getTokenRedirect() {
    const request = requestConfig;
    const currentAcc = myMSALObj.getActiveAccount();
    if (currentAcc) {
        request.account = currentAcc;
        myMSALObj.acquireTokenRedirect(request);
    }
}

async function getTokenSilently() {
    const request = requestConfig;
    const currentAcc = myMSALObj.getActiveAccount();
    if (currentAcc) {
        request.account = currentAcc;
        response = await myMSALObj.acquireTokenSilent(request).then(handleResponse).catch(error => {
            console.error(error);
        });
    }
}

async function getGuestTokenSilently() {
    const request = requestConfig;
    if (tenantConfig?.guest) {
        const currentAcc = myMSALObj.getActiveAccount();
        const guestAccount = myMSALObj.getAccount({ homeAccountId: currentAcc?.homeAccountId, tenantId: tenantConfig.guest.tenantId } );
        if (guestAccount) {
            response = await myMSALObj.acquireTokenSilent({ ...request, account: guestAccount }).then(handleResponse).catch(error => {
                console.error(error);
            });
        } else {
            const currentAcc = myMSALObj.getActiveAccount();
            response = await myMSALObj.acquireTokenSilent({
                 ...request,
                 account: currentAcc,
                 authority: tenantConfig.guest.authority,
                 cacheLookupPolicy: msal.CacheLookupPolicy.RefreshToken
            }).then(handleResponse).catch(error => {
                console.error(error);
            });
        }
    } else {
        console.error("Sample Configuration Error: No guest tenant in MSAL Config");
    }
}
