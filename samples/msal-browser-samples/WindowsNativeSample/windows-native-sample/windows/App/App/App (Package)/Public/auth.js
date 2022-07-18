// Browser check variables
// If you support IE, our recommendation is that you sign-in using Redirect APIs
// If you as a developer are testing using Edge InPrivate mode, please add "isEdge" to the if check

// import * as Msal from 'msal'; 

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
// const msal = require("./ionic-tutorial/node_modules/@azure/msal-browser/lib/msal-browser.js")
const myMSALObj = new msal.PublicClientApplication(msalConfig);

// Redirect: once login is successful and redirects with tokens, call Graph API
function init() {
    myMSALObj.initialize().then(() => {
        myMSALObj.handleRedirectPromise().then(handleResponse).catch(err => {
            console.error(err);
        });
    });
    console.log("initialized");
}
 //execute this on button press instead of on page load

function handleResponse(resp) {
    console.log("Now handling response");
    if(resp)
    {
        accountId = resp.account.homeAccountId;
        myMSALObj.setActiveAccount(resp.account);
        showWelcomeMessage(resp.account);
    }
    else
    {
        const currentAccounts = myMSALObj.getAllAccounts();
        if(!currentAccounts || currentAccounts.length < 1)
        {
            return;
        }
        accountId = currentAccounts[0].homeAccountId;
        myMSALObj.setActiveAccount(currentAccounts[0]);
        showWelcomeMessage(currentAccounts[0]);
    }
}

async function signIn(method) {
    loginMethod = isIE ? "redirect" : method;
    if(loginMethod === "redirect")
    {
        return myMSALObj.loginRedirect(loginRequest);
    }
    else
    {
        return myMSALObj.loginPopup(loginRequest).then(handleResponse).catch(function (error) {
            console.log(error);
        });
    }
}

async function signOut(method) {
    const logoutRequest = 
    {
        account: myMSALObj.getAccountByHomeId(accountId)
    };
    if(method === "redirect")
    {
        return myMSALObj.logoutRedirect(logoutRequest);
        //.then(showLoggedOutMessage).catch(function (error){
        //    console.log(error);
        // });
    }
    else
    {
        return myMSALObj.logoutPopup(logoutRequest).then(() => window.location.reload);
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
