// Load MSAL into service worker
importScripts("/msal/msal-browser.js")

// Page hosted by MSFT that can be used as a redirect uri. Must be a SPA redirect (not native)
const redirectUri = "https://login.microsoftonline.com/common/oauth2/nativeclient" 

// Instance of MSAL that will run exclusively in the service worker
const msalInstance = new msal.PublicClientApplication({
    auth: {
        authority: "https://login.microsoftonline.com/common/",
        clientId: "d9c9b66a-1121-4a62-bbd4-685f8d9ed6b6",
        redirectUri,
    },
    cache: {
        // localStorage and sessionStorage are not available in service workers.
        // TODO: async cache location (as IDB is supported in service workers)
        cacheLocation: "memoryStorage"
    },
    system: {
        // Feature flag to enable service worker compatibility
        enableServiceWorker: true
    }
});

async function getLoginUrl(request) {
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
    
let tabId;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
        case "login":
            // Open the login url in the main browser.
            // onUpdated listener below will parse the response.
            // TODO: error handling
            getLoginUrl({
                ...request,
                redirectUri
            })
                .then(url => {
                    chrome.tabs.create({
                        url
                    }, (newTab) => {
                        tabId = newTab.id;
                    });
                });

            break;

        // Silently acquires a token and returns to the UI.
        case "acquireToken":
            // TODO: error handling
            msalInstance.acquireTokenSilent(message.request)
                .then(result => {
                    sendResponse(result);
                })
    
        default:
            break;
    }

    // Allows sendResponse to be called async
    return true;

});

// Wait for the tab opened by the code above to be redirected to the redirect URI,
// then parse response and close tab.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
        changeInfo.status === "complete" &&
        tab.id === tabId && 
        tab.url.indexOf(`${redirectUri}#code=`) > -1
    ) {
        msalInstance.handleRedirectPromise(`#${tab.url.split("#")[1]}`)
            .then(result => {
                if (result) {
                    msalInstance.setActiveAccount(result.account);
                }
                chrome.tabs.remove(tabId);
            });
        
    }
});




