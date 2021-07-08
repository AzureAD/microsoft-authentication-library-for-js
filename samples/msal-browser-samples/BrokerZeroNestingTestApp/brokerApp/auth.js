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
const myMSALObj = new msal.PublicClientApplication(msalBrokerConfig);
myMSALObj.initializeBrokering().then(() => {
    // Must ensure that initialize has completed before calling any other MSAL functions
    myMSALObj.handleRedirectPromise().then(handleResponse).catch(err => {
        console.error(err);
    });

    enableSigninButton();
});

function handleResponse(resp) {
    if (resp !== null) {
        myMSALObj.setActiveAccount(resp.account);
        username = resp.account.username;
        setSignedInGlobal(resp.account);
    } else {
        // need to call getAccount here?
        const currentAccounts = myMSALObj.getAllAccounts();
        if (!currentAccounts || currentAccounts.length < 1) {
            return;
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
        } else if (currentAccounts.length === 1) {
            const accountObj = currentAccounts[0];
            myMSALObj.setActiveAccount(accountObj);
            username = accountObj.username;
            setSignedInGlobal(accountObj);
        }
    }
}

async function signIn(method) {
    signInType = isIE ? "loginRedirect" : method;
    if (signInType === "loginPopup") {
        return myMSALObj.loginPopup(loginRequest).then(handleResponse).catch(function (error) {
            console.log(error);
        });
    } else if (signInType === "loginRedirect") {
        return myMSALObj.loginRedirect(loginRequest);
    }
}

function signOut() {
    const logoutRequest = {
        account: myMSALObj.getAccountByUsername(username)
    };

    myMSALObj.logout(logoutRequest);
}
