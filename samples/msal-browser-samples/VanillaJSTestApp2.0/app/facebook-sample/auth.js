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
})

function handleResponse(resp) {
    if (resp !== null) {
        accountId = resp.account.homeAccountId;
        myMSALObj.setActiveAccount(resp.account);
        showWelcomeMessage(resp.account);
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

async function signIn(method) {
    signInType = method;
    if (signInType === "popup") {
        return myMSALObj.loginPopup({
            ...loginRequest,
            redirectUri: "/redirect"
        }).then(handleResponse).catch(function (error) {
            console.log(error);
        });
    } else if (signInType === "redirect") {
        return myMSALObj.loginRedirect(loginRequest)
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
        window.location.reload();
    }
}

async function getTokenPopup(request, account) {
    request.redirectUri = "/redirect"
    return await myMSALObj
        .acquireTokenSilent(request)
        .catch(async (error) => {
            console.log("silent token acquisition fails.");
            if (error instanceof msal.InteractionRequiredAuthError) {
                console.log("acquiring token using popup");
                return myMSALObj.acquireTokenPopup(request).catch((error) => {
                    console.error(error);
                });
            } else {
                console.error(error);
            }
        });
}

async function getTokenRedirect(request, account) {
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
