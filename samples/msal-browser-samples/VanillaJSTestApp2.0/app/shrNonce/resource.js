// Initialize lastRequestHeaders to keep track of the previous request's authentication headers
let lastRequestHeaders = new Headers();
/**
 * This is a sample 401 Unauthorized error WWW-Authenticate header for demonstration purposes. This header should come from the
 * relying party's response and will be internally parsed by AuthenticationHeaderParser.getShrNonce().
 */
const wwwAuthenticate = `PoP nonce="eyJhbGciOiJIUzI1NiIsImtpZCI6IktJRCIsInR5cCI6IkpXVCJ9.eyJ0cyI6IjE2MjU2NzI1MjkifQ.rA5ho63Lbdwo8eqZ_gUtQxY3HaseL0InIVwdgf7L_fc", error="nonce_malformed"`;
lastRequestHeaders.append("WWW-Authenticate", wwwAuthenticate);
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
        const authenticationHeaderParser = new msal.AuthenticationHeaderParser(lastRequestHeaders);
        const shrNonce = authenticationHeaderParser.getShrNonce();
        if (shrNonce) {
            popTokenRequest.shrNonce = shrNonce;
            console.log(popTokenRequest);
        }
        const response = await getTokenPopup(popTokenRequest, currentAcc).catch(error => {
            console.log(error);
        });
        popToken = response.accessToken;
        
        callPopResource(popConfig.endpoint, "GET", response.accessToken, updateUI);
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
