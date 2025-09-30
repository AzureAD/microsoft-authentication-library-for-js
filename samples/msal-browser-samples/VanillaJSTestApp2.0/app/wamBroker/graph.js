// Helper function to call MS Graph API endpoint 
// using authorization bearer token scheme
function callMSGraph(endpoint, accessToken, callback) {
    const headers = new Headers();
    const bearer = `Bearer ${accessToken}`;

    headers.append("Authorization", bearer);

    const options = {
        method: "GET",
        headers: headers
    };

    console.log('request made to Graph API at: ' + new Date().toString());

    fetch(endpoint, options)
        .then(response => response.json())
        .then(response => callback(response, endpoint))
        .catch(error => console.log(error));
}

async function seeProfile() {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
    if (currentAcc) {
        const response = await getTokenPopup(loginRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, updateUI);
    }
}

// Test functions for different prompt values
async function testTokenPromptCreate() {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
    if (currentAcc) {
        console.log("Testing token acquisition with prompt: create");
        const response = await getTokenPopupCreate(loginRequest, currentAcc).catch(error => {
            console.log("Error with prompt: create", error);
        });
        if (response) {
            console.log("Successfully acquired token with prompt: create", response);
        }
    } else {
        console.log("No account found. Please sign in first.");
    }
}

async function testTokenPromptNone() {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
    if (currentAcc) {
        console.log("Testing token acquisition with prompt: none");
        const response = await getTokenPopupNone(loginRequest, currentAcc).catch(error => {
            console.log("Error with prompt: none", error);
        });
        if (response) {
            console.log("Successfully acquired token with prompt: none", response);
        }
    } else {
        console.log("No account found. Please sign in first.");
    }
}

async function testTokenPromptLogin() {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
    if (currentAcc) {
        console.log("Testing token acquisition with prompt: login");
        const response = await getTokenPopupLogin(loginRequest, currentAcc).catch(error => {
            console.log("Error with prompt: login", error);
        });
        if (response) {
            console.log("Successfully acquired token with prompt: login", response);
        }
    } else {
        console.log("No account found. Please sign in first.");
    }
}

async function testTokenPromptConsent() {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
    if (currentAcc) {
        console.log("Testing token acquisition with prompt: consent");
        const response = await getTokenPopupConsent(loginRequest, currentAcc).catch(error => {
            console.log("Error with prompt: consent", error);
        });
        if (response) {
            console.log("Successfully acquired token with prompt: consent", response);
        }
    } else {
        console.log("No account found. Please sign in first.");
    }
}

async function testTokenPromptSelectAccount() {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
    if (currentAcc) {
        console.log("Testing token acquisition with prompt: select_account");
        const response = await getTokenPopupSelectAccount(loginRequest, currentAcc).catch(error => {
            console.log("Error with prompt: select_account", error);
        });
        if (response) {
            console.log("Successfully acquired token with prompt: select_account", response);
        }
    } else {
        console.log("No account found. Please sign in first.");
    }
}
