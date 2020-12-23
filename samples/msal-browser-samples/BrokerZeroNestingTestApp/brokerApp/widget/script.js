
// Config object to be passed to Msal on creation
const msalWidgetConfig = {
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
    },
    experimental: {
        brokerOptions: {
            allowBrokering: true,
            trustedBrokerDomains: ["http://localhost:30662"],
            brokeredRedirectUri: "http://localhost:30662"
        }
    }
};

const ssoReq = { 
    scopes: ["openid", "profile", "User.Read"],
    loginHint: "idlab@msidlab4.onmicrosoft.com" 
};

const myMSALWidgetObj = new msal.PublicClientApplication(msalWidgetConfig);
setTimeout(() => {
    myMSALWidgetObj.initializeBrokering().then(() => {
            // Must ensure that initialize has completed before calling any other MSAL functions
        myMSALWidgetObj.handleRedirectPromise().then(handleWidgetResponse).catch(err => {
            console.error(err);
        });  
    });
}, 2000);

function handleWidgetResponse(resp) {
    if (resp !== null) {
        myMSALWidgetObj.setActiveAccount(resp.account);
        username = resp.account.username;
    } else {
        // need to call getAccount here?
        const currentAccounts = myMSALWidgetObj.getAllAccounts();
        if (!currentAccounts || currentAccounts.length < 1) {
            myMSALWidgetObj.ssoSilent(ssoReq).then(() => {
                console.log("Widget SSO complete!");
            }).catch(err => {
                console.error(err);
                if (err instanceof msal.InteractionRequiredAuthError) {
                    return myMSALWidgetObj.loginPopup(ssoReq);
                }
            }).catch(err => {
                console.error(err);
            });
            return;
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
        } else if (currentAccounts.length === 1) {
            const accountObj = currentAccounts[0];
            myMSALWidgetObj.setActiveAccount(accountObj);
            username = accountObj.username;
        }
    }
}

async function getTokenPopup(request, account) {
    request.account = account;
    return await myMSALWidgetObj.acquireTokenSilent(request).catch(async (error) => {
        console.log("silent token acquisition fails.");
        if (error instanceof msal.InteractionRequiredAuthError) {
            console.log("acquiring token using popup");
            return myMSALWidgetObj.acquireTokenPopup(request).catch(error => {
                console.error(error);
            });
        } else {
            console.error(error);
        }
    });
}

// This function can be removed if you do not need to support IE
async function getTokenRedirect(request, account) {
    request.account = account;
    return await myMSALWidgetObj.acquireTokenSilent(request).catch(async (error) => {
        console.log("silent token acquisition fails.");
        if (error instanceof msal.InteractionRequiredAuthError) {
            // fallback to interaction when silent call fails
            console.log("acquiring token using redirect");
            myMSALWidgetObj.acquireTokenRedirect(request);
        } else {
            console.error(error);
        }
    });
}
