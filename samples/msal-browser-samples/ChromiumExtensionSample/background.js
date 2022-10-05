importScripts("/msal/msal-browser.js")

const msalInstance = new msal.PublicClientApplication({
    auth: {
        authority: "https://login.microsoftonline.com/common/",
        clientId: "36cb3b59-915a-424e-bc06-f8f557baa72f",
        redirectUri: "https://login.microsoftonline.com/common/oauth2/nativeclient" // Page hosted by MSFT that can be used as a redirect uri. Must be a SPA redirect (not native)
    },
    cache: {
        cacheLocation: "memoryStorage"
    },
    system: {
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
            getLoginUrl(message.request)
                .then(url => {
                    chrome.tabs.create({
                        url,
                        //active: false // useful for debugging
                    }, (newTab) => {
                        tabId = newTab.id;
                    });
                });

            break;

        case "acquireToken":
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

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
        changeInfo.status === "complete" &&
        tab.id === tabId && 
        tab.url.indexOf("https://login.microsoftonline.com/common/oauth2/nativeclient#code=") > -1
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




