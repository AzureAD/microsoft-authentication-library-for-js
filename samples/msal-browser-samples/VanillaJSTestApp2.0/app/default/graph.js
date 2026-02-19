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
    const currentAcc = myMSALObj.getAccount({accountId});
    if (currentAcc) {
        const response = await getTokenPopup(loginRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, updateUI);
        profileButton.style.display = 'none';
    }
}

async function readMail() {
    const currentAcc = myMSALObj.getAccount({accountId});
    if (currentAcc) {
        const response = await getTokenPopup(tokenRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callMSGraph(graphConfig.graphMailEndpoint, response.accessToken, updateUI);
        mailButton.style.display = 'none';
    }
}

async function testAcquireTokenSilent() {
    console.log("Testing acquireTokenSilent flow...");
    const currentAcc = myMSALObj.getAccount({accountId});
    if (currentAcc) {
        try {
            const response = await myMSALObj.acquireTokenSilent(silentRequest);
            console.log("acquireTokenSilent successful!", response);
            
            // Display results in the UI
            const resultDiv = document.createElement('div');
            resultDiv.className = 'alert alert-success mt-2';
            resultDiv.innerHTML = `
                <h6>acquireTokenSilent Success!</h6>
                <strong>Access Token:</strong> ${response.accessToken.substring(0, 50)}...<br>
                <strong>Scopes:</strong> ${response.scopes.join(', ')}<br>
                <strong>Account:</strong> ${response.account.username}<br>
                <strong>Expires On:</strong> ${response.expiresOn}
            `;
            
            // Add result to the profile div
            const profileDiv = document.getElementById('profile-div');
            profileDiv.appendChild(resultDiv);
            
        } catch (error) {
            console.error("acquireTokenSilent failed:", error);
            
            // Display error in the UI
            const errorDiv = document.createElement('div');
            errorDiv.className = 'alert alert-danger mt-2';
            errorDiv.innerHTML = `
                <h6>acquireTokenSilent Failed</h6>
                <strong>Error:</strong> ${error.errorCode || 'Unknown error'}<br>
                <strong>Message:</strong> ${error.errorMessage || error.message || 'No message available'}
            `;
            
            // Add error to the profile div
            const profileDiv = document.getElementById('profile-div');
            profileDiv.appendChild(errorDiv);
        }
    } else {
        console.log("No account found. User needs to sign in first.");
        alert("Please sign in first before testing acquireTokenSilent.");
    }
}

async function seeProfileRedirect() {
    const currentAcc = myMSALObj.getAccount({accountId});
    if (currentAcc) {
        const response = await getTokenRedirect(loginRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callMSGraph(graphConfig.graphMeEndpoint, response.accessToken, updateUI);
        profileButton.style.display = 'none';
    }
}

async function readMailRedirect() {
    const currentAcc = myMSALObj.getAccount({accountId});
    if (currentAcc) {
        const response = await getTokenRedirect(tokenRequest, currentAcc).catch(error => {
            console.log(error);
        });
        callMSGraph(graphConfig.graphMailEndpoint, response.accessToken, updateUI);
        mailButton.style.display = 'none';
    }
}
