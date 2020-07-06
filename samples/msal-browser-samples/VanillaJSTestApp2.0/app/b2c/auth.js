let signInType;
let username = "";

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
        username = resp.account.username;
        showWelcomeMessage(response.account);
        updateUI(response);
    } else {
        // need to call getAccount here?
        const currentAccounts = myMSALObj.getAllAccounts();
        if (currentAccounts === null) {
            return;
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
        } else if (currentAccounts.length === 1) {
            username = currentAccounts[0].username;
            showWelcomeMessage(currentAccounts[0]);
        }
    }    
}

async function signIn(method) {
    if (method === "loginPopup") {
        await myMSALObj.loginPopup().then(handleResponse).catch(function (error) {
            console.log(error);
        });
    } else if (method === "loginRedirect") {
        myMSALObj.loginRedirect();
    }
}

function signOut() {
    const currentAcc = account;
    myMSALObj.logout(currentAcc);
}

function getAccessTokenPopup() {
    request = tokenRequest
    request.account = myMSALObj.getAccountByUsername(username);
    myMSALObj.acquireTokenPopup(request).then(handleResponse).catch(error => {
        console.log(error);
    });
}

function getAccessTokenRedirect() {
    request = tokenRequest
    request.account = myMSALObj.getAccountByUsername(username);
    myMSALObj.acquireTokenRedirect(request);
}

function getAccessTokenSilent() {
    request = tokenRequest
    request.account = myMSALObj.getAccountByUsername(username);
    myMSALObj.acquireTokenSilent(request).then(handleResponse).catch(error => {
        console.log(error);
    })
}