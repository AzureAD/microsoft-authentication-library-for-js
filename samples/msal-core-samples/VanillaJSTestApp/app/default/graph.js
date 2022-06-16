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

function seeProfile() {
    if (myMSALObj.getAccount()) {
        getTokenPopup(loginRequest).then(response => {
            callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, updateUI);
            profileButton.style.display = 'none';
        }).catch(error => {
            console.log(error);
        });
    }
}

function readMail() {
    if (myMSALObj.getAccount()) {
        getTokenPopup(tokenRequest).then(response => {
            callMSGraph(graphConfig.graphMailEndpoint, response.accessToken, updateUI);
            mailButton.style.display = 'none';
        }).catch(error => {
            console.log(error);
        });
    }
}
