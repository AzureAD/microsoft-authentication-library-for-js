// Helper function to call MS Graph API endpoint 
// using authorization bearer token scheme
function callMSGraph(endpoint, accessToken, callback) {
    var bearer = "Bearer " + accessToken;

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
    getTokenRedirect(tokenRequest)
        .then(function (response) {
            // Will only execute if token was acquired silently
            callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, updateUI);
        }).catch(function (error) {
            console.log(error);
        });
}
