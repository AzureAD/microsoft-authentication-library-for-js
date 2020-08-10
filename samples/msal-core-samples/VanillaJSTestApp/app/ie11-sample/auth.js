// Browser check variables
// If you support IE, our recommendation is that you sign-in using Redirect APIs
// If you as a developer are testing using Edge InPrivate mode, please add "isEdge" to the if check
var ua = window.navigator.userAgent;
var msie = ua.indexOf("MSIE ");
var msie11 = ua.indexOf("Trident/");
var msedge = ua.indexOf("Edge/");
var isIE = msie > 0 || msie11 > 0;
var isEdge = msedge > 0;

// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
var myMSALObj = new Msal.UserAgentApplication(msalConfig);

// Register Callbacks for Redirect flow
myMSALObj.handleRedirectCallback(authRedirectCallBack);

function authRedirectCallBack(error, response) {
    if (error) {
        console.log(error);
    } else {
        if (response.tokenType === 'id_token' && myMSALObj.getAccount()) {
            console.log('id_token acquired at: ' + new Date().toString());
            showWelcomeMessage(myMSALObj.getAccount());
        } else if (response.tokenType === 'access_token') {
            console.log('access_token acquired at: ' + new Date().toString());
        } else {
            console.log('token type is: ' + response.tokenType);
        }
    }
}

// Redirect: once login is successful and redirects with tokens, call Graph API
if (myMSALObj.getAccount()) {
    // avoid duplicate code execution on page load in case of iframe and Popup window.
    showWelcomeMessage(myMSALObj.getAccount());
}

function signIn() {
    myMSALObj.loginRedirect(loginRequest);
}

function signOut() {
    myMSALObj.logout();
}

// This function can be removed if you do not need to support IE
function getTokenRedirect(request) {
    return myMSALObj.acquireTokenSilent(request)
        .then(function(response) {
            console.log(response);
            return response;
        }).catch(function (error) {
            console.log(error)
            console.log("silent token acquisition fails. acquiring token using redirect");
            // fallback to interaction when silent call fails
            return myMSALObj.acquireTokenRedirect(request);
        });
}
