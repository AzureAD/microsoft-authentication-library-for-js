// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
let myMSALObj, requestConfig, tenantConfig, signInType;

// EAR (Encrypted Authorize Response) toggle. When the sample is loaded with
// ?ear=true, force the EAR protocol mode on top of whatever testConfig.json
// provides.
const EAR_ENABLED =
    new URLSearchParams(window.location.search).get("ear") === "true";

initializeMsal();

async function initializeMsal() {
    return fetch("testConfig.json").then(response => {
        return response.json();
    }).then((authConfig) => {
        if (EAR_ENABLED) {
            authConfig.msalConfig.system = {
                ...authConfig.msalConfig.system,
                protocolMode: msal.ProtocolMode.EAR,
            };
        }
        myMSALObj = new msal.PublicClientApplication(authConfig.msalConfig);
        window.msalApp = myMSALObj;
        requestConfig = authConfig.request;
        tenantConfig = authConfig.tenants;
        myMSALObj.initialize().then(() => {
            setInitializedFlagTrue(); // Used as a flag in the test to ensure that MSAL has been initialized
            myMSALObj.handleRedirectPromise().then(handleResponse).catch(err => {
                console.error(err);
            });

            myMSALObj.addEventCallback((event) => {
                if (event.eventType === msal.EventType.ACTIVE_ACCOUNT_CHANGED) {
                    activeAccount = myMSALObj.getActiveAccount();
                    if(activeAccount) {
                        showWelcomeMessage(activeAccount);
                    }
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
                activeAccount = currentAccounts.sort((a, b) => {
                    const aIsHome = a.tenantId === a.homeAccountId.split(".")[1] ? 1 : 0;
                    const bIsHome = b.tenantId === b.homeAccountId.split(".")[1] ? 1 : 0;
                    return bIsHome - aIsHome;
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
    const request = { ...requestConfig };
    if ((signInType === "popupGuest" || signInType === "redirectGuest") && tenantConfig?.guest) {
        request.authority = tenantConfig.guest.authority;
    }
    if (signInType === "popup" || signInType === "popupGuest") {
        return myMSALObj.loginPopup(request).then(handleResponse).catch(function (error) {
            console.log(error);
        });
    } else if (signInType === "redirect" || signInType === "redirectGuest") {
        return myMSALObj.loginRedirect(request);
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

async function getTokenPopup(method = "GET") {
    const request = { ...requestConfig };
    if (method === "POST") {
        request.httpMethod = "POST";
    }
    const currentAcc = myMSALObj.getActiveAccount();
    if (currentAcc) {
        request.account = currentAcc;
        response = await myMSALObj.acquireTokenPopup(request).then(handleResponse).catch(error => {
            console.error(error);
        });
    }
}

async function getTokenRedirect(method = "GET") {
    const request = { ...requestConfig };
    if (method === "POST") {
        request.httpMethod = "POST";
    }
    const currentAcc = myMSALObj.getActiveAccount();
    if (currentAcc) {
        request.account = currentAcc;
        myMSALObj.acquireTokenRedirect(request);
    }
}

async function getTokenSilently(tenantKey) {
    const request = { ...requestConfig };
    const currentAcc = myMSALObj.getActiveAccount();
    if (!currentAcc) return;

    const tenantCfg = tenantKey ? tenantConfig?.[tenantKey] : null;
    if (tenantKey && !tenantCfg) {
        console.error(`Sample Configuration Error: No "${tenantKey}" tenant in MSAL Config`);
        return;
    }
    if (tenantCfg) {
        const tenantAccount = myMSALObj.getAccount({ homeAccountId: currentAcc.homeAccountId, tenantId: tenantCfg.tenantId });
        if (tenantAccount) {
            request.account = tenantAccount;
        } else {
            request.account = currentAcc;
            request.authority = tenantCfg.authority;
            request.cacheLookupPolicy = msal.CacheLookupPolicy.RefreshToken;
        }
    } else {
        request.account = currentAcc;
    }

    response = await myMSALObj.acquireTokenSilent(request).then(handleResponse).catch(error => {
        console.error(error);
    });
}
