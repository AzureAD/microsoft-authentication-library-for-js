// Set the redirect URI to the chromiumapp.com provided by Chromium
const redirectUri = typeof chrome !== "undefined" && chrome.identity ?
    chrome.identity.getRedirectURL() : 
    `${window.location.origin}/index.html`;

console.log("Chrome extension redirect URI set to ", redirectUri);
console.log("This url must be registered in the Azure portal as a single-page application redirect uri, and as the post logout url");

const msalInstance = new msal.PublicClientApplication({
    auth: {
        authority: "https://login.microsoftonline.com/common/",
        clientId: "d9c9b66a-1121-4a62-bbd4-685f8d9ed6b6",
        redirectUri,
        postLogoutRedirectUri: redirectUri
    },
    cache: {
        cacheLocation: "localStorage"
    }
});

// Set currently logged in account
const accounts = msalInstance.getAllAccounts();
if (accounts.length) {
    document.getElementById("username").innerHTML = accounts[0].username;
}

/**
 * Adds a sign in button for the user signed into the browser
 */
getSignedInUser()
    .then(async (user) => {
        if (user?.email) {
            // chrome.identity
            const signInHintButton = document.getElementById("sign-in-hint");
            signInHintButton.innerHTML = `Sign In (w/ ${user.email})`;
            signInHintButton.addEventListener("click", async () => {
                const url = await getLoginUrl({
                    loginHint: user.email
                });

                const result = await launchWebAuthFlow(url);

                document.getElementById("username").innerHTML = result?.account.username;
            });
            signInHintButton.classList.remove("hidden");

            // Browser window
            const signInHintBrowserButton = document.getElementById("sign-in-browser-hint");
            signInHintBrowserButton.innerHTML = `Sign In (w/ ${user.email})`;
            signInHintBrowserButton.addEventListener("click", async () => {
                const url = await getLoginUrl({
                    loginHint: user.email
                });

                const result = await launchWebAuthFlow(url, true);

                document.getElementById("username").innerHTML = result?.account.username;
            });
            signInHintBrowserButton.classList.remove("hidden");
        }
    })

/**
 * Sign in button
 */
document.getElementById("sign-in").addEventListener("click", async () => {
    const url = await getLoginUrl({
        scopes: [ "user.read" ]
    });

    const result = await launchWebAuthFlow(url);

    document.getElementById("username").innerHTML = result?.account.username;
});

document.getElementById("sign-in-browser").addEventListener("click", async () => {
    const url = await getLoginUrl({
        scopes: [ "user.read" ]
    });

    await launchWebAuthFlow(url, true);
});

// Messages from background script to process response
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.url) {
        msalInstance.handleRedirectPromise(`#${message.url.split("#")[1]}`)
            .then((result) => {
                if (result) {
                    document.getElementById("username").innerHTML = result.account.username;
                    chrome.tabs.remove(message.tabId);
                }
            })
            .catch((error) => {
                
            })
    }
});

/**
 * Sign out button
 */
document.getElementById("sign-out").addEventListener("click", async () => {
    document.getElementById("username").innerHTML = "";
    document.getElementById("displayname").innerHTML = "";
    
    const logoutUrl = await getLogoutUrl();

    await launchWebAuthFlow(logoutUrl);
});

document.getElementById("call-graph").addEventListener("click", async () => {
    const graphResult = await callGraphMeEndpoint();

    document.getElementById("displayname").innerHTML = graphResult?.displayName;
});

document.getElementById("call-graph-browser").addEventListener("click", async () => {
    const graphResult = await callGraphMeEndpoint(true);

    document.getElementById("displayname").innerHTML = graphResult?.displayName;
});

/**
 * Generates a login url
 */
async function getLoginUrl(request = {}) {
    return new Promise((resolve, reject) => {
        msalInstance.loginRedirect({
            ...request,
            onRedirectNavigate: (url) => {
                resolve(url);
                return false;
            }
        }).catch(reject);
    });
}

/**
 * Generates a logout url
 */
async function getLogoutUrl(request) {
    return new Promise((resolve, reject) => {
        msalInstance.logout({
            ...request,
            onRedirectNavigate: (url) => {
                resolve(url);
                return false;
            }
        }).catch(reject);
    });
}

/**
 * Makes an http request to the MS graph Me endpoint
 */
async function callGraphMeEndpoint(serviceWorker) {
    const {
        accessToken
    } = await acquireToken({
        scopes: [ "user.read" ],
        account: serviceWorker ? msalInstance.getAllAccounts()[0] : undefined
    }, serviceWorker);
    return callMSGraph("https://graph.microsoft.com/v1.0/me", accessToken);
}

/**
 * Makes an http request to the given MS graph endpoint
 */
async function callMSGraph(endpoint, accessToken) {
    const headers = new Headers();
    const bearer = `Bearer ${accessToken}`;

    headers.append("Authorization", bearer);

    const options = {
        method: "GET",
        headers
    };

    return fetch(endpoint, options)
        .then(response => response.json())
        .catch(error => console.log(error));
}

/**
 * Attempts to silent acquire an access token, falling back to interactive.
 */
async function acquireToken(request, serviceWorker) {
    if (serviceWorker) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: "acquireToken",
                request
            }, (response) => {
                return resolve(response);
            })
        })
    }
    
    return msalInstance.acquireTokenSilent(request)
        .catch(async (error) => {
            console.error(error);
            const acquireTokenUrl = await getAcquireTokenUrl(request);

            return launchWebAuthFlow(acquireTokenUrl);
        })
}

/**
 * Generates an acquire token url
 */
async function getAcquireTokenUrl(request) {
    return new Promise((resolve, reject) => {
        msalInstance.acquireTokenRedirect({
            ...request,
            onRedirectNavigate: (url) => {
                resolve(url);
                return false;
            }
        }).catch(reject);
    });
}

/**
 * Launch the Chromium web auth UI.
 * @param {*} url AAD url to navigate to.
 * @param {*} inBrowser Whether to perform login in the browser
 */
async function launchWebAuthFlow(url, inBrowser) {
    return new Promise(async (resolve, reject) => {
        if (inBrowser) {
            const user = await getSignedInUser();
            chrome.runtime.sendMessage({
                action: "login",
                request: {
                    loginHint: user.email
                }
            }, (message) => {
                resolve();
            })
        } else {
            chrome.identity.launchWebAuthFlow({
                interactive: true,
                url
            }, (responseUrl) => {
                // Response urls includes a hash (login, acquire token calls)
                if (responseUrl?.includes("#")) {
                    msalInstance.handleRedirectPromise(`#${responseUrl.split("#")[1]}`)
                        .then(resolve)
                        .catch(reject)
                } else {
                    // Logout calls
                    resolve();
                }
            })
        }
    })
}

/**
 * Returns the user sign into the browser.
 */
async function getSignedInUser() {
    return new Promise((resolve, reject) => {
        if (chrome && chrome.identity) {
            // Running in extension popup
            chrome.identity.getProfileUserInfo((user) => {
                if (user) {
                    resolve(user);
                } else {
                    resolve(null);
                }
            });
        } else {
            // Running on localhost
            resolve(null);
        }
    })
}
