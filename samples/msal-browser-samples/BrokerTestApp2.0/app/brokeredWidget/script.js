
// Config object to be passed to Msal on creation
const msalConfig = {
    auth: {
        clientId: "abdd063b-76df-4d97-afc3-05dd10c8b017"
    },
    cache: {
        cacheLocation: "sessionStorage", // This configures where your cache will be stored
        storeAuthStateInCookie: false, // Set this to "true" if you are having issues on IE11 or Edge
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case msal.LogLevel.Error:
                        console.error(message);
                        return;
                    case msal.LogLevel.Info:
                        console.info(message);
                        return;
                    case msal.LogLevel.Verbose:
                        console.debug(message);
                        return;
                    case msal.LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            }
        }
    }
};

const expMsalConfig = {
    brokerOptions: {
        allowBrokering: true,
        trustedBrokerDomains: ["http://localhost:30663"]
    }
};

let username;
const experimentalApp = new msal.ExperimentalPublicClientApplication(msalConfig, expMsalConfig);
experimentalApp.initializeBrokering().then(() => {
    // Must ensure that initialize has completed before calling any other MSAL functions
    experimentalApp.handleRedirectPromise().then(handleResponse).catch(err => {
        console.error(err);
    });   
});

const contentElement = document.getElementsByClassName("myContent")[0];

document.getElementById("brokerLoginBtn").addEventListener("click", () => {
    const loginReq = { 
        scopes: ["openid", "profile", "User.Read"],
        loginHint: "idlab@msidlab4.onmicrosoft.com" 
    };

    experimentalApp.ssoSilent(loginReq).then(handleResponse).catch(err => {
        console.error(err);
        if (err instanceof msal.InteractionRequiredAuthError) {
            return experimentalApp.loginPopup(loginReq);
        }
        contentElement.innerHTML = "I am unable to get data, from where I sit, the Identity provider does not think I am logged in";
    }).catch(err => {
        console.error(err);
        contentElement.innerHTML = "I am unable to get data, from where I sit, the Identity provider does not think I am logged in. Tried a popup.";
    });
});

function handleResponse(resp) {
    if (resp !== null) {
        username = resp.account.username;
    } else {
        // need to call getAccount here?
        const currentAccounts = experimentalApp.getAllAccounts();
        if (!currentAccounts || currentAccounts.length < 1) {
            contentElement.innerHTML = "Currently signed out";
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
        } else if (currentAccounts.length === 1) {
            username = currentAccounts[0].username;
        }
    }
    getGraphUserData();
}

function getGraphUserData() {
    const accounts = experimentalApp.getAllAccounts();
    if (accounts && accounts.length > 0) {
        const request = {
            scopes: ["openid", "profile", "User.Read"],
            account: accounts[0]
        };
        experimentalApp.acquireTokenSilent(request).then(res => {
            setTimeout(() => {
                const contentElement = document.getElementsByClassName("myContent")[0];
                contentElement.innerHTML = "Great I was able to get an access token for this data, and now I going to go get it!";
    
                setTimeout(() => {
                    const headers = new Headers();
                    const bearer = `Bearer ${res.accessToken}`;
    
                    headers.append("Authorization", bearer);
                    const options = {
                        method: "GET",
                        headers: headers
                    };
                    fetch("https://graph.microsoft.com/v1.0/me", options)
                        .then(response => response.json())
                        .then(response => {
                            contentElement.innerHTML = "";
                            const title = document.createElement("p");
                            title.innerHTML = "<strong>Title: </strong>" + response.jobTitle;
                            const email = document.createElement("p");
                            email.innerHTML = "<strong>Mail: </strong>" + response.mail;
                            const phone = document.createElement("p");
                            phone.innerHTML = "<strong>Phone: </strong>" + response.businessPhones[0];
                            const address = document.createElement("p");
                            address.innerHTML = "<strong>Location: </strong>" + response.officeLocation;
                            contentElement.appendChild(title);
                            contentElement.appendChild(email);
                            contentElement.appendChild(phone);
                            contentElement.appendChild(address);
                        })
                        .catch(error => console.log(error));
                }, 1000);
    
            }, 500);
        })
        .catch(console.error);
    }
}
