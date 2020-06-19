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
myMSALObj.handleRedirectPromise().then(response => {
    if (response) {
        handleResponse(response);
    }
}).catch(error => {
    console.log(error);
});

function handleResponse(response) {
    if (response !== null) {
        showWelcomeMessage(response.account);
    } else {
        // need to call getAccount here?
        const currentAccounts = myMSALObj.getAllAccounts();
        if (currentAccounts === null) {
            return;
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
        } else if (currentAccounts.length === 1) {
            showWelcomeMessage(currentAccounts[0]);
        }
    }
    
    if (response.tokenType === "Bearer") {
        console.log('access_token acquired at: ' + new Date().toString());
        updateUI(response);
        accessTokenButtonPopup.style.display = 'none';
        accessTokenButtonRedirect.style.display = 'none';
    } else {
        console.log("token type is:" + response.tokenType);
    }
}

// Redirect: once login is successful and redirects with tokens, call Graph API
let currentAccounts = myMSALObj.getAllAccounts();
let account = ""
if (currentAccounts.length === 1) {
    // avoid duplicate code execution on page load in case of iframe and Popup window.
    account = currentAccounts[0];
    showWelcomeMessage(account);
}

async function signIn(method) {
    signInType = isIE ? "loginRedirect" : method;
    if (signInType === "loginPopup") {
        const loginResponse = await myMSALObj.loginPopup(loginRequest).then(handleResponse).catch(function (error) {
            console.log(error);
        });
    } else if (signInType === "loginRedirect") {
        myMSALObj.loginRedirect(loginRequest);
    }
}

function signOut() {
    const currentAcc = account;
    myMSALObj.logout(currentAcc);
}

function getAccessTokenPopup() {
    request = loginRequest
    request.account = account;
    myMSALObj.acquireTokenPopup(request).then(handleResponse).catch(error => {
        console.log(error);
    });
}

function getAccessTokenRedirect() {
    request = loginRequest
    request.account = account;
    myMSALObj.acquireTokenRedirect(request);
}

function getAccessTokenSilent() {
    request = loginRequest
    request.account = account;
    myMSALObj.acquireTokenSilent(request).then(handleResponse).catch(error => {
        console.log(error);
    })
}