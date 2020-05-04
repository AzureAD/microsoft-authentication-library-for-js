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

// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
const myMSALObj = new msal.PublicClientApplication(msalConfig); 

// Register Callbacks for Redirect flow
myMSALObj.handleRedirectPromise().then((tokenResponse) => {
    const accountObj = tokenResponse ? tokenResponse.account : myMSALObj.getAccount();
    if (accountObj) {
        // Account object was retrieved, continue with app progress
        console.log('id_token acquired at: ' + new Date().toString());
        showWelcomeMessage(accountObj);
        seeProfileRedirect();
    } else if (tokenResponse && tokenResponse.tokenType === "Bearer") {
        // No account object available, but access token was retrieved
        console.log('access_token acquired at: ' + new Date().toString());
    } else if (tokenResponse === null) {
        // tokenResponse was null, attempt sign in or enter unauthenticated state for app
        signIn("loginRedirect");
    } else {
        console.log("tokenResponse was not null but did not have any tokens: " + tokenResponse);
    }
}).catch((error) => {
    console.log(error);
});

async function signIn(method) {
    signInType = isIE ? "loginRedirect" : method;
    if (signInType === "loginPopup") {
        const loginResponse = await myMSALObj.loginPopup(loginRequest).catch(function (error) {
            console.log(error);
        });
        console.log(loginResponse);
        if (myMSALObj.getAccount()) {
            showWelcomeMessage(myMSALObj.getAccount());
        }
    } else if (signInType === "loginRedirect") {
        myMSALObj.loginRedirect(loginRequest)
    }
}

function signOut() {
    myMSALObj.logout();
}

async function getTokenPopup(request) {
    return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
        console.log("silent token acquisition fails.");
        if (error instanceof msal.AuthenticationRequiredError) {
            if (msal.AuthenticationRequiredError.isInteractionRequiredError(error.errorCode, error.errorDesc)) {
                // fallback to interaction when silent call fails
                console.log("acquiring token using popup");
                return myMSALObj.acquireTokenPopup(request).catch(error => {
                    console.error(error);
                });
            }
        } else {
            console.error(error);
        }
    });
}

// This function can be removed if you do not need to support IE
async function getTokenRedirect(request) {
    return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
        console.log("silent token acquisition fails.");
        if (error instanceof AuthenticationRequiredError) {
            if (AuthenticationRequiredError.isInteractionRequiredError(error.errorCode, error.errorDesc)) {
                // fallback to interaction when silent call fails
                console.log("acquiring token using redirect");
                myMSALObj.acquireTokenRedirect(request);
            }
        } else {
            console.error(error);
        }
    });
}

async function seeProfileRedirect() {
    if (myMSALObj.getAccount()) {
        const response = await getTokenRedirect(loginRequest).catch(error => {
            console.log(error);
        });
        callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, updateUI);
        profileButton.style.display = 'none';
    }
}

async function readMailRedirect() {
    if (myMSALObj.getAccount()) {
        const response = await getTokenRedirect(tokenRequest).catch(error => {
            console.log(error);
        });
        callMSGraph(graphConfig.graphMailEndpoint, response.accessToken, updateUI);
        mailButton.style.display = 'none';
    }
}
