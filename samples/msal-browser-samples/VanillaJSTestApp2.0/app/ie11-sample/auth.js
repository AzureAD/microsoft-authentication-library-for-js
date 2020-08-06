let username = "";

// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
const myMSALObj = new msal.PublicClientApplication(msalConfig);

// Redirect: once login is successful and redirects with tokens, call Graph API
myMSALObj.handleRedirectPromise().then(handleResponse).catch(function (err) {
    console.error(err);
});

function handleResponse(resp) {
    if (resp !== null) {
        username = resp.account.username;
        showWelcomeMessage();

        if (resp.accessToken) {
            callMSGraph(graphConfig.graphMeEndpoint, resp.accessToken, updateUI);
            profileButton.style.display = 'none';
        }
    } else {
        // need to call getAccount here?
        const currentAccounts = myMSALObj.getAllAccounts();
        if (!currentAccounts || currentAccounts.length < 1) {
            return;
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
        } else if (currentAccounts.length === 1) {
            username = currentAccounts[0].username;
            console.log(username)
            showWelcomeMessage();
        }
    }
}

function signIn() {
    myMSALObj.loginRedirect(request)
}

function signOut() {
    const logoutRequest = {
        account: myMSALObj.getAccountByUsername(username)
    };

    myMSALObj.logout(logoutRequest);
}

function getTokenRedirect(request, account) {
    request.account = account;
    return new Promise(function(resolve, reject) { 
        myMSALObj.acquireTokenSilent(request).then(function (response) {
            resolve(response)
        }).catch(function (error) {
            console.log("silent token acquisition fails.");
            if (error instanceof msal.InteractionRequiredAuthError) {
                // fallback to interaction when silent call fails
                console.log("acquiring token using redirect");
                myMSALObj.acquireTokenRedirect(request);
            } else {
                console.error(error);
                reject(error);
            }
        });
    });
}
