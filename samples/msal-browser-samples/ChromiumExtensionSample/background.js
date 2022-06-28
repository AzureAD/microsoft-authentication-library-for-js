let tabId;
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    tabId = message.tabId;
    sendResponse(message);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (
        changeInfo.status === "complete" &&
        tab.id === tabId && 
        tab.url.indexOf("https://login.microsoftonline.com/common/oauth2/nativeclient#code=") > -1
    ) {
        chrome.action.openPopup()
            .then(() => {
                chrome.runtime.sendMessage({
                    url: tab.url,
                    tabId
                })
            })
        
    }
});




