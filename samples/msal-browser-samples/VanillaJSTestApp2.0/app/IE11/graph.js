// Helper function to call MS Graph API endpoint 
// using authorization bearer token scheme
function callMSGraph(endpoint, accessToken, callback) {
    const headers = new Headers();
    const bearer = "Bearer " + accessToken;

    headers.append("Authorization", bearer);

    const options = {
        method: "GET",
        headers: headers
    };

    console.log('request made to Graph API at: ' + new Date().toString());

    fetch(endpoint, options)
        .then(function (response) { return response.json() })
        .then(function (response) { callback(response) })
        .catch(function (error) { console.log(error) });
}

function seeProfileRedirect() {
    const currentAcc = myMSALObj.getAccountByUsername(username);
    if (currentAcc) {
        getTokenRedirect(request, currentAcc).then(function (response) {
            // Will only execute if token was acquired silently
            callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, updateUI);
            profileButton.style.display = 'none';
        }).catch(function (error) {
            console.log(error);
        });
    }
}
