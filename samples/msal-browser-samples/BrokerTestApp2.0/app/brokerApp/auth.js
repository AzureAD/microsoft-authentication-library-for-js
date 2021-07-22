/*
 * Browser check variables
 * If you support IE, our recommendation is that you sign-in using Redirect APIs
 * If you as a developer are testing using Edge InPrivate mode, please add "isEdge" to the if check
 */
const ua = window.navigator.userAgent;
const msie = ua.indexOf("MSIE ");
const msie11 = ua.indexOf("Trident/");
const msedge = ua.indexOf("Edge/");
const isIE = msie > 0 || msie11 > 0;
const isEdge = msedge > 0;

let signInType;
let username = "";

/*
 * Create the main myMSALObj instance
 * configuration parameters are located at authConfig.js
 */
const experimentalApp = new msal.ExperimentalPublicClientApplication(msalConfig, expMsalConfig);
experimentalApp.initializeBrokering().then(() => {
    // Must ensure that initialize has completed before calling any other MSAL functions
    experimentalApp.handleRedirectPromise().then(handleResponse).catch(err => {
        console.error(err);
    });

    enableSigninButton();
});

function handleResponse(resp) {
    if (resp !== null) {
        experimentalApp.setActiveAccount(resp.account);
        username = resp.account.username;
        showWelcomeMessage(resp.account);
    } else {
        // need to call getAccount here?
        const currentAccounts = experimentalApp.getAllAccounts();
        if (!currentAccounts || currentAccounts.length < 1) {
            return;
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
        } else if (currentAccounts.length === 1) {
            const accountObj = currentAccounts[0];
            experimentalApp.setActiveAccount(accountObj);
            username = accountObj.username;
            showWelcomeMessage(accountObj);
        }
    }
}

async function signIn(method) {
    signInType = isIE ? "loginRedirect" : method;
    if (signInType === "loginPopup") {
        return experimentalApp.loginPopup(loginRequest).then(handleResponse).catch(function (error) {
            console.log(error);
        });
    } else if (signInType === "loginRedirect") {
        return experimentalApp.loginRedirect(loginRequest);
    }
}

function signOut() {
    const logoutRequest = {
        account: experimentalApp.getAccountByUsername(username)
    };

    experimentalApp.logout(logoutRequest);
}

async function getTokenPopup(request, account) {
    request.account = account;
    return await experimentalApp.acquireTokenSilent(request).catch(async (error) => {
        console.log("silent token acquisition fails.");
        if (error instanceof msal.InteractionRequiredAuthError) {
            console.log("acquiring token using popup");
            return experimentalApp.acquireTokenPopup(request).catch(error => {
                console.error(error);
            });
        } else {
            console.error(error);
        }
    });
}

// This function can be removed if you do not need to support IE
async function getTokenRedirect(request, account) {
    request.account = account;
    return await experimentalApp.acquireTokenSilent(request).catch(async (error) => {
        console.log("silent token acquisition fails.");
        if (error instanceof msal.InteractionRequiredAuthError) {
            // fallback to interaction when silent call fails
            console.log("acquiring token using redirect");
            experimentalApp.acquireTokenRedirect(request);
        } else {
            console.error(error);
        }
    });
}
