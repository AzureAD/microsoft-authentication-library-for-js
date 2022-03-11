// Browser check variables
// If you support IE, our recommendation is that you sign-in using Redirect APIs
// If you as a developer are testing using Edge InPrivate mode, please add "isEdge" to the if check
const ua = window.navigator.userAgent;
const msie = ua.indexOf("MSIE ");
const msie11 = ua.indexOf("Trident/");
const msedge = ua.indexOf("Edge/");
const isIE = msie > 0 || msie11 > 0;
const isEdge = msedge > 0;

let signInType;
let accountId = "";

// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
const myMSALObj = new msal.PublicClientApplication(msalConfig);

// Redirect: once login is successful and redirects with tokens, call Graph API
myMSALObj.handleRedirectPromise().then(handleResponse).catch(err => {
    console.error(err);
});

async function handleResponse(resp) {
    if (resp !== null) {
        accountId = resp.account.homeAccountId;
        myMSALObj.setActiveAccount(resp.account);
        showWelcomeMessage(resp.account);
    } else {
        // need to call getAccount here?
        const currentAccounts = myMSALObj.getAllAccounts();
        if (!currentAccounts || currentAccounts.length < 1) {
            return;
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
        } else if (currentAccounts.length === 1) {
            const activeAccount = currentAccounts[0];
            myMSALObj.setActiveAccount(activeAccount);
            accountId = activeAccount.homeAccountId;
            showWelcomeMessage(activeAccount);
        }
    }

    if (myMSALObj.getAllAccounts().length > 0) {
        const sessionId = myMSALObj.getAllAccounts()[0].idTokenClaims.sid;
        const tenantId = myMSALObj.getAllAccounts()[0].idTokenClaims.tid;
        const clientId = "245e9392-c666-4d51-8f8a-bfd9e55b2456";
        const authorityOrigin = "https://login.microsoftonline.com";

        // check is true is 3p cookies are available, false is 3p cookie are potentially blocked
        const check = await checkSession(authorityOrigin, tenantId, clientId, sessionId)
            .catch(error => {
                return error;
            })
        console.log("check", check);
    }
}


/**
 * Uses the checksession endpoint to determine if third-party cookies are available. Should be invoked immediately after logging in.
 * @param {string} authorityOrigin Domain of the eSTS server, e.g. https://login.microsoftonline.com
 * @param {string} tenantId Tenant ID for the user
 * @param {string} clientId Client ID for the application
 * @param {string} sessionId Session ID (sid) for the User
 * @returns Boolean indicate if third-party cookies are likely to be available (true means 3p cookies are available)
 */
 async function checkSession(authorityOrigin, tenantId, clientId, sessionId) {
    return new Promise((resolve, reject) => {
        // Create iframe
        const iframe = document.createElement("iframe");

        // Wait for response for 5 seconds
        const timeout = setTimeout(() => {
            // Clean up
            window.removeEventListener("message", messageListener);
            if (iframe.parentElement === document.body) {
                document.body.removeChild(iframe)
            }

            reject("Timeout");
        }, 5000);

        // Add listener for response from checksession page
        const messageListener = (e) => {
            if (e.origin === authorityOrigin) {
                // Cleanup
                window.removeEventListener("message", messageListener);
                clearTimeout(timeout);
                if (iframe.parentElement === document.body) {
                    document.body.removeChild(iframe)
                }

                // "unchanged" means cookies were found in the iframe for requested session
                resolve(e.data === "unchanged");
            }
        };
        window.addEventListener("message", messageListener);

        // Build hidden iframe
        const iframeUrl = `${authorityOrigin}/${tenantId}/oauth2/checksession`;

        // When iframe loads, send message into iframe and wait for response above
        iframe.addEventListener("load", e => {
            iframe.contentWindow.postMessage(`${clientId} ${sessionId}`, authorityOrigin);
        });

        // Add hidden iframe to page
        iframe.src = iframeUrl;
        iframe.style.visibility = "hidden";
        iframe.style.position = "absolute";
        iframe.style.width = iframe.style.height = "0";
        iframe.style.border = "0";

        document.body.appendChild(iframe);
    });
}

async function signIn(method) {
    signInType = isIE ? "redirect" : method;
    if (signInType === "popup") {
        return myMSALObj.loginPopup(loginRequest).then(handleResponse).catch(function (error) {
            console.log(error);
        });
    } else if (signInType === "redirect") {
        return myMSALObj.loginRedirect(loginRequest)
    }
}

function signOut(interactionType) {
    const logoutRequest = {
        account: myMSALObj.getAccountByHomeId(accountId)
    };

    if (interactionType === "popup") {
        myMSALObj.logoutPopup(logoutRequest).then(() => {
            window.location.reload();
        });
    } else {
        myMSALObj.logoutRedirect(logoutRequest);
    }
}

async function getTokenPopup(request, account) {
    return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
        console.log("silent token acquisition fails.");
        if (error instanceof msal.InteractionRequiredAuthError) {
            console.log("acquiring token using popup");
            return myMSALObj.acquireTokenPopup(request).catch(error => {
                console.error(error);
            });
        } else {
            console.error(error);
        }
    });
}

// This function can be removed if you do not need to support IE
async function getTokenRedirect(request, account) {
    return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
        console.log("silent token acquisition fails.");
        if (error instanceof msal.InteractionRequiredAuthError) {
            // fallback to interaction when silent call fails
            console.log("acquiring token using redirect");
            myMSALObj.acquireTokenRedirect(request);
        } else {
            console.error(error);
        }
    });
}
