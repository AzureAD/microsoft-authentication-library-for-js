let lastRequestHeaders = new Headers();
const wwwAuthenticate = `PoP nonce="eyJhbGciOiJIUzI1NiIsImtpZCI6IktJRCIsInR5cCI6IkpXVCJ9.eyJ0cyI6IjE2MjU2NzI1MjkifQ.rA5ho63Lbdwo8eqZ_gUtQxY3HaseL0InIVwdgf7L_fc", error="nonce_malformed"`;
lastRequestHeaders.append("WWW-Authenticate", wwwAuthenticate);
let popToken = "";

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

    const options = {
        method: method,
        headers: headers
    };

    console.log(`request made to endpoint ${endpoint} at: ` + new Date().toString());

    fetch(endpoint, options)
        .then(response => {
            lastRequestHeaders = response.headers;
            console.log("Headers: ", lastRequestHeaders);
            return response.json();
        })
        .then(response => callback(response, endpoint))
        .catch(error => console.log(error));
}

async function popRequest() {
    const currentAcc = myMSALObj.getAccountByUsername(username);
    if (currentAcc) {
        const authorizationHeaderParser = new msal.AuthorizationHeaderParser(lastRequestHeaders);
        const shrNonce = authorizationHeaderParser.getShrNonce();
        if (shrNonce && shrNonce != "") {
            popTokenRequest.shrNonce = shrNonce;
            console.log(popTokenRequest);
        }
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
                showPopTokenAcquired();
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

async function readMail() {
    const currentAcc = myMSALObj.getAccountByUsername(username);
    if (currentAcc) {
        const response = await getTokenPopup(tokenRequest, currentAcc).catch(error => {
            console.log(error);
        });
        popToken = response.accessToken;
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
        popToken = response.accessToken;
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
        popToken = response.accessToken;
        callMSGraph(graphConfig.graphMailEndpoint, response.accessToken, updateUI);
        mailButton.style.display = "none";
    }
}
