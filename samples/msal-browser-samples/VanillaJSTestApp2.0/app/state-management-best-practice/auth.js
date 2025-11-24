/**
 * This file demonstrates the RECOMMENDED pattern for using the OAuth state parameter
 * when preserving user location during authentication flows.
 * 
 * Key points:
 * 1. URLs are stored in browser storage (sessionStorage by default)
 * 2. A unique reference key is used in the state parameter
 * 3. URLs are validated before navigation to prevent security issues
 * 4. Expired state is automatically cleaned up
 */

// Browser check variables
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

myMSALObj.initialize().then(() => {
    /**
     * RECOMMENDED PATTERN: Handle redirect with state management
     * The state parameter contains a reference key, not the URL itself
     */
    myMSALObj.handleRedirectPromise()
        .then(handleResponse)
        .catch(err => {
            console.error(err);
        });
});

function handleResponse(resp) {
    if (resp !== null) {
        accountId = resp.account.homeAccountId;
        myMSALObj.setActiveAccount(resp.account);
        showWelcomeMessage(resp.account);
        
        /**
         * RECOMMENDED PATTERN: Retrieve the return URL from storage
         * The state parameter contains a reference key, not the actual URL
         */
        if (resp.state) {
            const returnUrl = AuthStateStorage.getReturnUrl(resp.state);
            
            if (returnUrl) {
                console.log('Returning to original URL:', returnUrl);
                // Optionally navigate back to the original page
                // Uncomment the next line if you want automatic navigation
                // window.location.href = returnUrl;
            } else {
                console.log('No valid return URL found in state');
            }
        }
    } else {
        // need to call getAccount here?
        const currentAccounts = myMSALObj.getAllAccounts();
        if (!currentAccounts || currentAccounts.length < 1) {
            return;
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
            console.warn('Multiple accounts found');
        } else if (currentAccounts.length === 1) {
            const activeAccount = currentAccounts[0];
            myMSALObj.setActiveAccount(activeAccount);
            accountId = activeAccount.homeAccountId;
            showWelcomeMessage(activeAccount);
        }
    }
}

/**
 * RECOMMENDED PATTERN: Sign in with state management
 * Instead of putting the URL directly in state, we store it in browser storage
 * and use a reference key in the state parameter
 */
async function signIn(method) {
    signInType = isIE ? "redirect" : method;
    
    /**
     * RECOMMENDED PATTERN: Save the current URL to storage
     * This returns a unique reference key that we'll use in the state parameter
     * 
     * ❌ ANTI-PATTERN (Do NOT do this):
     *    state: window.location.pathname
     * 
     * ✅ CORRECT PATTERN (Do this instead):
     *    Save URL to storage first, then use the reference key
     */
    const currentUrl = window.location.pathname + window.location.search;
    const stateKey = AuthStateStorage.saveReturnUrl(currentUrl);
    
    console.log('Saved return URL to storage with key:', stateKey);
    console.log('Original URL:', currentUrl);
    
    if (signInType === "popup") {
        return myMSALObj.loginPopup({
            ...loginRequest,
            state: stateKey  // ✅ Using reference key instead of URL
        }).then(handleResponse).catch(function (error) {
            console.error(error);
        });
    } else if (signInType === "redirect") {
        return myMSALObj.loginRedirect({
            ...loginRequest,
            state: stateKey  // ✅ Using reference key instead of URL
        });
    }
}

function signOut() {
    const logoutRequest = {
        account: myMSALObj.getAccountByHomeId(accountId)
    };

    myMSALObj.logoutRedirect(logoutRequest);
}

async function getTokenRedirect(request, account) {
    request.account = account;
    return await myMSALObj.acquireTokenSilent(request).catch(async (error) => {
        console.warn("silent token acquisition fails. acquiring token using redirect");
        console.warn(error);
        if (error instanceof msal.InteractionRequiredAuthError) {
            /**
             * RECOMMENDED PATTERN: Also use state management for acquireTokenRedirect
             * If you need to preserve the user's location when acquiring tokens
             */
            const currentUrl = window.location.pathname + window.location.search;
            const stateKey = AuthStateStorage.saveReturnUrl(currentUrl);
            
            return myMSALObj.acquireTokenRedirect({
                ...request,
                state: stateKey  // ✅ Using reference key
            }).catch(error => {
                console.error(error);
            });
        } else {
            console.error(error);
        }
    });
}

/**
 * This function demonstrates advanced state management
 * You can store complex application state, not just URLs
 */
function signInWithComplexState(method) {
    signInType = isIE ? "redirect" : method;
    
    // Save complex application state
    const stateKey = AuthStateStorage.saveApplicationState({
        returnUrl: window.location.pathname + window.location.search,
        scrollPosition: window.scrollY,
        timestamp: Date.now(),
        // Add any other state you need to preserve
    });
    
    console.log('Saved complex application state with key:', stateKey);
    
    if (signInType === "popup") {
        return myMSALObj.loginPopup({
            ...loginRequest,
            state: stateKey
        }).then(resp => {
            handleResponse(resp);
            
            // Restore complex state
            if (resp && resp.state) {
                const appState = AuthStateStorage.getApplicationState(resp.state);
                if (appState) {
                    console.log('Restored application state:', appState);
                    // Restore scroll position
                    if (appState.scrollPosition) {
                        window.scrollTo(0, appState.scrollPosition);
                    }
                }
            }
        }).catch(error => {
            console.error(error);
        });
    } else if (signInType === "redirect") {
        return myMSALObj.loginRedirect({
            ...loginRequest,
            state: stateKey
        });
    }
}
