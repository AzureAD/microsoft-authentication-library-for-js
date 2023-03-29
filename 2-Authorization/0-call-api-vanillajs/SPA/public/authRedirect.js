// Create the main myMSALObj instance
// configuration parameters are located at authConfig.js
const myMSALObj = new msal.PublicClientApplication(msalConfig);

let username = '';
let todolistData = [];

/**
 * A promise handler needs to be registered for handling the
 * response returned from redirect flow. For more information, visit:
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/initialization.md#redirect-apis
 */
myMSALObj
    .handleRedirectPromise()
    .then(handleResponse)
    .catch((error) => {
        console.error(error);
    });

function selectAccount() {
    /**
     * See here for more info on account retrieval:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
     */

    const currentAccounts = myMSALObj.getAllAccounts();

    if (!currentAccounts) {
        return;
    } else if (currentAccounts.length > 1) {
        // Add your account choosing logic here
        console.warn('Multiple accounts detected.');
    } else if (currentAccounts.length === 1) {
        username = currentAccounts[0].username;
        welcomeUser(username);
        updateTable();
    }
}

function getAccount() {
    const accounts = myMSALObj.getAllAccounts();
    if (accounts.length > 0) {
        return accounts[0];
    }
    return null;
}

function handleResponse(response) {
    /**
     * To see the full list of response object properties, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#response
     */

    if (response !== null) {
        username = response.account.username;
        welcomeUser(username);
        updateTable();
    } else {
        selectAccount();

        /**
         * If you already have a session that exists with the authentication server, you can use the ssoSilent() API
         * to make request for tokens without interaction, by providing a "login_hint" property. To try this, comment the
         * line above and uncomment the section below.
         */

        // myMSALObj.ssoSilent(silentRequest).
        //     then(() => {
        //         const currentAccounts = myMSALObj.getAllAccounts();
        //         username = currentAccounts[0].username;
        //         welcomeUser(username);
        //         updateTable();
        //     }).catch(error => {
        //         console.error("Silent Error: " + error);
        //         if (error instanceof msal.InteractionRequiredAuthError) {
        //             signIn();
        //         }
        //     });
    }
}

function getTokenRedirect(request) {
    /**
     * See here for more info on account retrieval:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-common/docs/Accounts.md
     */
    request.account = myMSALObj.getAccountByUsername(username);

    return myMSALObj.acquireTokenSilent(request).catch((error) => {
        console.error(error);
        console.warn('silent token acquisition fails. acquiring token using popup');
        if (error instanceof msal.InteractionRequiredAuthError) {
            // fallback to interaction when silent call fails
            return myMSALObj.acquireTokenRedirect(request);
        } else {
            console.error(error);
        }
    });
}

async function passTokenToApi() {
    try {
        const tokenRequest = {
            scopes: [...protectedResources.apiTodoList.scopes.read],
        };
        const tokenResponse = await getTokenRedirect(tokenRequest);
        if (tokenResponse && tokenResponse.accessToken) {
            const apiResponse = await callApi(
                'GET',
                protectedResources.apiTodoList.endpoint,
                tokenResponse.accessToken
            );
            const data = await apiResponse.json();
            if (data.errors) throw data;
            if (data) {
                todolistData = data;
                showTodoListItems(data);
            }
        }
    } catch (error) {
        console.error(error);
    }
}

async function handleTodoList(todolist, method, endpoint) {
    try {
        let tokenRequest = {
            scopes: [...protectedResources.apiTodoList.scopes.write],
        };
        const tokenResponse = await getTokenRedirect(tokenRequest);
        if (tokenResponse && tokenResponse.accessToken) {
            const apiResponse = await callApi(method, endpoint, tokenResponse.accessToken, todolist);
            if ((method === 'POST' && apiResponse.status === 200) || apiResponse.status === 201) {
                const data = await apiResponse.json();
                AddTaskToList(data);
            } else if (method === 'DELETE' && apiResponse.status === 204) {
                RemoveTaskFromList(todolist);
            }
        }
    } catch (error) {
        console.error(error);
    }
}

function signIn() {
    /**
     * You can pass a custom request object below. This will override the initial configuration. For more information, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#request
     */

    myMSALObj.loginRedirect(loginRequest);
}

function signOut() {
    /**
     * You can pass a custom request object below. This will override the initial configuration. For more information, visit:
     * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/request-response-object.md#request
     */

    // Choose which account to logout from by passing a username.
    const logoutRequest = {
        account: myMSALObj.getAccountByUsername(username),
    };

    myMSALObj.logoutRedirect(logoutRequest);
}
