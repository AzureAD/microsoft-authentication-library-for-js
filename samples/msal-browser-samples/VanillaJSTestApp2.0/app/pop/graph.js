/**
 * Helper function to call MS Graph API endpoint 
 * using authorization bearer token scheme
 * @param {*} endpoint 
 * @param {*} accessToken 
 * @param {*} callback 
 */
function callMSGraph(endpoint, accessToken, callback) {
    const headers = new Headers();
    const bearer = `Bearer ${accessToken}`;

    headers.append("Authorization", bearer);

    const options = {
        method: "GET",
        headers: headers
    };

    console.log("request made to Graph API at: " + new Date().toString());

    fetch(endpoint, options)
        .then(response => response.json())
        .then(response => callback(response, endpoint))
        .catch(error => console.log(error));
}

function callPopResource(endpoint, method, accessToken, callback) {
    const headers = new Headers();
    const authHeader = `PoP ${accessToken}`;

    headers.append("Authorization", authHeader);
    headers.append("Content-Type", "text/plain");
    headers.append("Secret", "da95c040-20bd-40bc-9548-7eeef460ba87");
    headers.append("Authority", "https://login.microsoftonline.com/f645ad92-e38d-4d1a-b510-d1b09a74a8ca/");
    headers.append("ClientId", "4b0db8c2-9f26-4417-8bde-3f0e3656f8e0");
    headers.append("ShrUri", "https://signedhttprequest.azurewebsites.net/api/validateSHR");
    headers.append("ShrMethod", "POST");

    const options = {
        method: method,
        headers: headers
    };

    console.log(`request made to endpoint ${endpoint} at: ` + new Date().toString());

    fetch(endpoint, options)
        .then(response => response.json())
        .then(response => callback(response, endpoint))
        .catch(error => console.log(error));
}

async function popRequest() {
    const currentAcc = myMSALObj.getAccountByUsername(username);
    if (currentAcc) {
        const response = await getTokenPopup(loginRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callPopResource(popConfig.endpoint, "POST", response.accessToken, updateUI);
    }
}

async function seeProfile() {
    const currentAcc = myMSALObj.getAccountByUsername(username);
    if (currentAcc) {
        const response = await getTokenPopup(loginRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, updateUI);
        profileButton.style.display = "none";
    }
}

async function readMail() {
    const currentAcc = myMSALObj.getAccountByUsername(username);
    if (currentAcc) {
        const response = await getTokenPopup(tokenRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callMSGraph(graphConfig.graphMailEndpoint, response.accessToken, updateUI);
        mailButton.style.display = "none";
    }
}

async function seeProfileRedirect() {
    const currentAcc = myMSALObj.getAccountByUsername(username);
    if (currentAcc) {
        const response = await getTokenRedirect(loginRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, updateUI);
        profileButton.style.display = "none";
    }
}

async function readMailRedirect() {
    const currentAcc = myMSALObj.getAccountByUsername(username);
    if (currentAcc) {
        const response = await getTokenRedirect(tokenRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callMSGraph(graphConfig.graphMailEndpoint, response.accessToken, updateUI);
        mailButton.style.display = "none";
    }
}
