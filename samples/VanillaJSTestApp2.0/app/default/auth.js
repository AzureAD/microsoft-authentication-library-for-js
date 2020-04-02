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
myMSALObj.handleRedirectCallback(authRedirectCallBack);

function authRedirectCallBack(error, response) {
    if (error) {
        console.log(error);
    } else {
        if (myMSALObj.getAccount()) {
            console.log('id_token acquired at: ' + new Date().toString());
            showWelcomeMessage(myMSALObj.getAccount());
            getTokenRedirect(loginRequest);
        } else if (response.tokenType === "Bearer") {
            console.log('access_token acquired at: ' + new Date().toString());
        } else {
            console.log("token type is:" + response.tokenType);
        }
    }
}

// Redirect: once login is successful and redirects with tokens, call Graph API
if (myMSALObj.getAccount()) {
    // avoid duplicate code execution on page load in case of iframe and Popup window.
    showWelcomeMessage(myMSALObj.getAccount());
} else {
    myMSALObj.acquireTokenSilent(silentRequest).then((tokenResponse) => {
        if (myMSALObj.getAccount()) {
            console.log('id_token acquired at: ' + new Date().toString());
            showWelcomeMessage(myMSALObj.getAccount());
            getTokenRedirect(loginRequest);
        } else if (tokenResponse.tokenType === "Bearer") {
            console.log('access_token acquired at: ' + new Date().toString());
        } else {
            console.log("token type is:" + response.tokenType);
        }
    }).catch(error => {
        if (error.errorCode !== "interaction_required") {
            console.error(error);
        }
    });
}

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
    return await myMSALObj.getTokens(request).catch(async (error) => {
        console.log("silent token acquisition fails.");
        if (error.errorCode === "interaction_required" || error.errorCode === "consent_required") {
            console.log(error.errorCode);
            console.log("acquiring token using popup");
            // fallback to interaction when silent call fails
            return await myMSALObj.acquireTokenPopup(request).catch(error => {
                console.log(error);
            });
        } else {
            console.error(error);
        }
    });
}

// This function can be removed if you do not need to support IE
async function getTokenRedirect(request) {
    return await myMSALObj.getTokens(request).catch(error => {
        console.log("silent token acquisition fails.");
        if (error.errorCode === "interaction_required" || error.errorCode === "consent_required") {
            console.log("acquiring token using redirect");
            // fallback to interaction when silent call fails
            return myMSALObj.acquireTokenRedirect(request)
        } else {
            console.error(error);
        }
    });
}
