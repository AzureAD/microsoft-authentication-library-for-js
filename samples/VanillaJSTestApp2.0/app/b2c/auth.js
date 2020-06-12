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
        authRedirectCallBack(response);
    }
}).catch(error => {
    console.log(error);
});

function authRedirectCallBack(response) {
    if (myMSALObj.getAccount()) {
        console.log('id_token acquired at: ' + new Date().toString());
        showWelcomeMessage(myMSALObj.getAccount());
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
if (myMSALObj.getAccount()) {
    // avoid duplicate code execution on page load in case of iframe and Popup window.
    showWelcomeMessage(myMSALObj.getAccount());
}

async function signIn(method) {
    signInType = isIE ? "loginRedirect" : method;
    if (signInType === "loginPopup") {
        const loginResponse = await myMSALObj.loginPopup({}).catch(function (error) {
            console.log(error);
        });
        console.log(loginResponse);
        if (myMSALObj.getAccount()) {
            showWelcomeMessage(myMSALObj.getAccount());
        }
    } else if (signInType === "loginRedirect") {
        myMSALObj.loginRedirect({});
    }
}

function signOut() {
    myMSALObj.logout();
}

function getAccessTokenPopup() {
    if (myMSALObj.getAccount()) {
        myMSALObj.acquireTokenPopup(loginRequest).then(response => {
            updateUI(response);
            accessTokenButtonPopup.style.display = 'none';
            accessTokenButtonRedirect.style.display = 'none';
        }).catch(error => {
            console.log(error);
        });
    }
}

function getAccessTokenRedirect() {
    if (myMSALObj.getAccount()) {
        myMSALObj.acquireTokenRedirect(loginRequest);
    }
}

function getAccessTokenSilent() {
    if (myMSALObj.getAccount()) {
        myMSALObj.acquireTokenSilent(loginRequest).then(response => {
            updateUI(response);
            accessTokenButtonPopup.style.display = 'none';
            accessTokenButtonRedirect.style.display = 'none';
        }).catch(error => {
            console.log(error);
        })
    }
}