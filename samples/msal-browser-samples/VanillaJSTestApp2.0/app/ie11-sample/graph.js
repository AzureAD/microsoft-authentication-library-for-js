// Helper function to call MS Graph API endpoint 
// using authorization bearer token scheme
function callMSGraph(endpoint, accessToken, callback) {
    const bearer = "Bearer " + accessToken;

    var xmlHTTP = new XMLHttpRequest();
    xmlHTTP.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            callback(JSON.parse(this.responseText));
        }
    }
    xmlHTTP.open("GET", endpoint, true);
    xmlHTTP.setRequestHeader('Authorization', bearer)
    xmlHTTP.send();
}

function seeProfileRedirect() {
    const currentAcc = myMSALObj.getAccountByHomeId(accountId);
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
