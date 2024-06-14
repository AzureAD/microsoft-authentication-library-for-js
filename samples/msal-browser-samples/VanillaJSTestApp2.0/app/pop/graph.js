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

let popToken = "";
function callPopResource(endpoint, method, accessToken, callback) {
    const headers = new Headers();
    const authHeader = `PoP ${accessToken}`;

    headers.append("Authorization", authHeader);

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
        const response = await getTokenPopup(popTokenRequest, currentAcc).catch(error => {
            console.log(error);
        });
        popToken = response.accessToken;
        
        callPopResource(popConfig.endpoint, "POST", response.accessToken, updateUI);
    }
}

async function fetchPopToken() {
    const currentAcc = myMSALObj.getAccountByUsername(username);
    if (currentAcc) {
        popToken = getTokenPopup(popTokenRequest, currentAcc).then(response => {
            if (response.accessToken) {
                showPopTokenAcquired(response.accessToken);
                return response.accessToken;
            }
        }).catch(error => {
            console.log(error);
        });
    }
}

async function fetchPopTokenWithKid() {
    const currentAcc = myMSALObj.getAccountByUsername(username);
    if (currentAcc) {
        return getTokenPopup(popTokenWithKidRequest, currentAcc).then(response => {
            if (response.accessToken) {
                showPopTokenWithKidAcquired(response.accessToken);
                return response.accessToken;
            }
        }).catch(error => {
            console.log(error);
        });
    }
}

async function seeProfile() {
    const currentAcc = myMSALObj.getAccountByUsername(username);
    if (currentAcc) {
        const response = await getTokenPopup(bearerTokenRequest, currentAcc).catch(error => {
            console.log(error);
        });
        popToken = response.accessToken;
        callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, updateUI);
        profileButton.style.display = "none";
    }
}

async function seeProfileRedirect() {
    const currentAcc = myMSALObj.getAccountByUsername(username);
    if (currentAcc) {
        const response = await getTokenRedirect(loginRequest, currentAcc).catch(error => {
            console.log(error);
        });
        popToken = response.accessToken;
        callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, updateUI);
        profileButton.style.display = "none";
    }
}