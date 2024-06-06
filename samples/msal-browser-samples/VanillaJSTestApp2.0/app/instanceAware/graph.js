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

function getGraphMeEndpoint(msGraphHost) {
    if (!msGraphHost) {
        return "https://graph.microsoft-ppe.com/v1.0/me";
    }
    return `https://${msGraphHost}/v1.0/me`
}

function getGraphMailEndpoint(msGraphHost) {
    if (!msGraphHost) {
        return "https://graph.microsoft-ppe.com/v1.0/me/messages";
    }
    return `https://${msGraphHost}/v1.0/me/messages`
}

async function seeProfile() {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
    if (currentAcc) {
        const response = await getTokenPopup(loginRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callMSGraph(getGraphMeEndpoint(response.msGraphHost), response.accessToken, updateUI);
        profileButton.style.display = 'none';
    }
}

async function readMail() {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
    if (currentAcc) {
        const response = await getTokenPopup(tokenRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callMSGraph(getGraphMailEndpoint(response.msGraphHost), response.accessToken, updateUI);
        mailButton.style.display = 'none';
    }
}

async function seeProfileRedirect() {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
    if (currentAcc) {
        const response = await getTokenRedirect(loginRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callMSGraph(getGraphMeEndpoint(response.msGraphHost), response.accessToken, updateUI);
        profileButton.style.display = 'none';
    }
}

async function readMailRedirect() {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
    if (currentAcc) {
        const response = await getTokenRedirect(tokenRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callMSGraph(getGraphMailEndpoint(response.msGraphHost), response.accessToken, updateUI);
        mailButton.style.display = 'none';
    }
}
