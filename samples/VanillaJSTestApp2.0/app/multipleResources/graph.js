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
    if (myMSALObj.getAccount()) {
        const response = await getTokenPopup(loginRequest).catch(error => {
            console.log(error);
        });
        callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, updateUI);
        profileButton.style.display = 'none';
    }
}

async function acquireSecondToken() {
    if (myMSALObj.getAccount()) {
        const response = await getTokenPopup(tokenRequest).catch(error => {
            console.log(error);
        });
        updateUI("Second Token Acquired", "")
        secondTokenButton.style.display = 'none';
    }
}
