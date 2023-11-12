let signInType;
let accountId = "";

// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
const myMSALObj = new msal.PublicClientApplication(msalConfig);

// Redirect: once login is successful and redirects with tokens, call Graph API
myMSALObj.initialize().then(() => {
    myMSALObj.handleRedirectPromise().then(handleResponse).catch(err => {
        console.error(err);
    });
});

function handleResponse() {
    // when a filter is passed into getAllAccounts, it returns all cached accounts that match the filter. Use isHomeTenant filter to get the home accounts.
    const allAccounts = myMSALObj.getAllAccounts({ tenantId: homeTenant, username: "hemoral@microsoft.com" });
    console.log("Get all accounts: ", allAccounts);
    if (!allAccounts || allAccounts.length < 1) {
        return;
    } else if (allAccounts.length >= 1) {
        // Get all accounts returns the homeAccount with tenantProfiles when multiTenantAccountsEnabled is set to true
        pickActiveAccountAndTenantProfile(allAccounts[0]);
    }
}

// Determines whether there is one or multiple tenant profiles to pick from and sets the active account based on the user selection if necessary.
async function pickActiveAccountAndTenantProfile(account) {
        // Set home tenant profile as default active account
        let activeAccount = myMSALObj.getActiveAccount();
        if (!activeAccount) {
            activeAccount = account;
            myMSALObj.setActiveAccount(activeAccount);
        }
        accountId = activeAccount.homeAccountId;
        showWelcomeMessage(activeAccount);
        showTenantProfilePicker(account.tenantProfiles || new Map(), activeAccount);
}

async function setActiveAccount(tenantId) {
    console.log("Set to: ", tenantId);
    // Sets the active account to the cached account object matching the tenant profile selected by the user.
    let activeAccount = myMSALObj.getActiveAccount();
    const newActiveAccount = myMSALObj.getAccount({ tenantId: tenantId });
    console.log(newActiveAccount);
    if (newActiveAccount) {
        myMSALObj.setActiveAccount(newActiveAccount);
        accountId = activeAccount.homeAccountId;
    }
    handleResponse();
}

async function signIn(signInType) {
    if (signInType === "popup") {
        return myMSALObj.loginPopup(loginRequest).then(handleResponse).catch(function (error) {
            console.log(error);
        });
    } else if (signInType === "redirect") {
        return myMSALObj.loginRedirect(loginRequest)
    }
}

function signOut(interactionType) {
    const logoutRequest = {
        account: myMSALObj.getActiveAccount()
    };

    if (interactionType === "popup") {
        myMSALObj.logoutPopup(logoutRequest).then(() => {
            window.location.reload();
        });
    } else {
        myMSALObj.logoutRedirect(logoutRequest);
    }
}

async function requestGuestToken() {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
    if (currentAcc) {
        const response = await getTokenRedirect({ ...guestTenantRequest, account: currentAcc }).catch(error => {
            console.log(error);
        });
        console.log(response);
        callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, updateUI);
        guestProfileButton.style.display = 'none';
    }
}

async function getTokenRedirect(request) {
    console.log("Request: ", request);
    return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
        console.log("silent token acquisition fails.");
        if (error instanceof msal.InteractionRequiredAuthError) {
            // fallback to interaction when silent call fails
            console.log("acquiring token using redirect");
            myMSALObj.acquireTokenRedirect(request);
        } else {
            console.error(error);
        }
    });
}