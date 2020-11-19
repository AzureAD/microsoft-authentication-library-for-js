// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
/**
 * MSALModule.java functions as a wrapper around MSAL for Android's signing in, signing out, and acquiring tokens functionality.
 * It is a proof of concept, focusing on single account mode and AAD.
 */

package com.reactlibrary;

import android.util.Log;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.facebook.react.bridge.WritableNativeMap;
import com.microsoft.identity.client.*;
import com.microsoft.identity.client.exception.MsalException;

import static com.facebook.react.views.textinput.ReactTextInputManager.TAG;

//import constants from Constants.java
import static com.reactlibrary.Constants.*;

import java.util.Arrays;

public class MSALModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;
    private ISingleAccountPublicClientApplication publicClientApplication;

    public MSALModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;

        try{
            //initialize publicClientApplication with config file, located in main/java/res/raw/auth_config_single_account.json
            publicClientApplication = PublicClientApplication.createSingleAccountPublicClientApplication(
                reactContext,
                reactContext.getResources().getIdentifier("auth_config_single_account", "raw", reactContext.getPackageName()));
        } catch (Exception e) {
            //will handle this
            Log.d(TAG, "Something wrong with initialization of publicClientApplication: " + e.toString());
        }
    }

     /**
   * getName(): MSAL is the name used when importing the module from native modules
   */
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * SignIn: calls the signIn method of ISingleAccountPublicClientApplication.
     * Parameters: string scopesValue (string containing scopes separated by a " "), Promise promise (returned to an async function)
     */
    @ReactMethod
    public void signIn(String scopesValue, Promise promise) {
        if (!scopesValue.isEmpty()) {
            publicClientApplication.signIn(getCurrentActivity(), null, scopesValue.toLowerCase().split(" "), getLoginCallback(promise));
        } else {
            //the default is User.Read
            publicClientApplication.signIn(getCurrentActivity(), null, DEFAULT_SCOPES, getLoginCallback(promise));
        }
    }

    /**
     * getLoginCallback should log messages of a successful authentication, update the current account, and then resolve/reject a promise
     * Based on getAuthCallback()
     */

    private AuthenticationCallback getLoginCallback(final Promise promise) {
        return new AuthenticationCallback() {

            @Override
            public void onSuccess(IAuthenticationResult authenticationResult) {
                Log.d(TAG, "Successfully authenticated");

            //update account
                Log.d(TAG, "Account: " + authenticationResult.getAccount().getUsername());
                promise.resolve(mapAccount(authenticationResult.getAccount()));
            }

            @Override
            public void onError(MsalException exception) {
                /* Failed to acquireToken */
                Log.d(TAG, "Authentication failed: " + exception.toString());
                promise.reject("Authentication failed: " + exception.toString(), exception);
            }

            @Override
            public void onCancel() {
                /* User canceled the authentication */
                Log.d(TAG, "User cancelled login.");
                promise.reject("userCancel", "User cancelled login.");
            }
        };
    }

   /**
     * getAccount(): retrieves account currently signed in
     * Parameters: Promise promise (resolve will return the account as a map if it exists; reject will return exception)
     * See getAccountCallback for more
     */
    @ReactMethod
    public void getAccount(Promise promise) {
        publicClientApplication.getCurrentAccountAsync(getAccountCallback(promise));
    }

    /**
     * getAccountCallback will resolve with an account if retrieved and reject with an exception in the case of an error.
     */

    private ISingleAccountPublicClientApplication.CurrentAccountCallback getAccountCallback(final Promise promise) {
        return new ISingleAccountPublicClientApplication.CurrentAccountCallback() {
            @Override
            public void onAccountLoaded(IAccount activeAccount) {
                if (activeAccount != null) {
                    Log.d(TAG, "Account: " + activeAccount.getUsername());
                    promise.resolve(mapAccount(activeAccount));
                }
                else promise.resolve(null);
            }

            @Override
            public void onAccountChanged(IAccount priorAccount, IAccount currentAccount) {
                Log.d(TAG, "Previous Account: " + priorAccount.getUsername());
                Log.d(TAG, "Current Account: " + currentAccount.getUsername());
                promise.resolve(mapAccount(currentAccount));
            }

            @Override
            public void onError(@NonNull MsalException exception) {
                Log.d(TAG, "Error loading account: " + exception.toString());
                promise.reject(exception);
            }
        };
    }

     /**
     * loadAccount(): will load a currently signed in account. 
     * Returns an IAccount if an account exists; returns null if no account is signed in or an error occurs
     */

    private IAccount loadAccount() {
        if (publicClientApplication == null) {
            return null;
        }
        try {
            ICurrentAccountResult result = publicClientApplication.getCurrentAccount();
            IAccount currAccount = result.getCurrentAccount();
            if (currAccount == null) {
                Log.d(TAG, "No account currently signed in.");
            } else {
                Log.d(TAG, "Retrieved account.");
            }
            return currAccount;
        } catch (Exception e) {
            Log.d(TAG, "Error loading account: " + e.toString());
            return null;
        }
        
    }

     /**
     * isSharedDevice: returns a boolean on if device is shared or not
     * Parameters: Promise promise (resolve will return a boolean and reject will return an exception)
     */
    @ReactMethod
    public void isSharedDevice(Promise promise) {
        try {
            promise.resolve(publicClientApplication.isSharedDevice());
        } catch (Exception error) {
            Log.d(TAG, "Error in 'isSharedDevice': " + error.toString());
            promise.reject(error);
        }
    }

    /**
     * signOut(): signs out the user currently signed in
     * Parameters: Promise promise (resolve will return a boolean true if account was successfully signed out and reject will return the exception)
     */
    @ReactMethod
    public void signOut(final Promise promise) {
        publicClientApplication.signOut (new ISingleAccountPublicClientApplication.SignOutCallback() {
            @Override
            public void onSignOut() {
                Log.d(TAG, "User successfully signed out.");
                promise.resolve(true);
            }

            @Override
            public void onError(@NonNull MsalException exception) {
                Log.d(TAG, "Error while signing out: " + exception.toString());
                promise.reject(exception);
            }
        });
    }

    /**
     * acquireToken: attempts to obtain a token interactively
     * Parameters: string scopesValue (string containing scopes separated by a " "), Promise promise (returned to an async function)
     */
    @ReactMethod
    public void acquireToken(String scopesValue, Promise promise) {
        if (!scopesValue.isEmpty()) {
            publicClientApplication.acquireToken(getCurrentActivity(), scopesValue.toLowerCase().split(" "), getAuthInteractiveCallback(promise));
        } else {
            //the default is User.Read
            publicClientApplication.acquireToken(getCurrentActivity(), DEFAULT_SCOPES, getAuthInteractiveCallback(promise));
        }
    }

    /**
     * getAuthInteractiveCallback is the callback function for acquireToken.
     * If successful, it will return a map of the IAuthenticationResult.
     * If there's an error, the exception will be returned.
     */

    private AuthenticationCallback getAuthInteractiveCallback(final Promise promise) {
        return new AuthenticationCallback() {
            @Override
            public void onCancel() {
                Log.d(TAG, "User cancelled login (acquireToken).");
                promise.reject("userCancel", "User cancelled login (acquireToken).");
            }

            @Override
            public void onSuccess(IAuthenticationResult authenticationResult) {
                Log.d(TAG, "Acquire token interactively success.");
                promise.resolve(mapMSALResult(authenticationResult));
            }

            @Override
            public void onError(MsalException exception) {
                Log.d(TAG, "Error while acquiring token interactively: " + exception.toString());
                promise.reject(exception);
            }
        };
    }

    /**
     * acquireTokenSilent: attempts to obtain a token silently from the cache
     * Parameters: string scopesValue (string containing scopes separated by a " "), Promise promise (returned to an async function)
     */
    @ReactMethod
    public void acquireTokenSilent(String scopesValue, Promise promise) {
        //get account
        IAccount account = loadAccount();
        if (account == null) {
            promise.reject("loadaccountnull", "acquireTokenSilent: No signed in account, or exception. Check Android log for details.");
        } else if (!scopesValue.isEmpty()) {
            publicClientApplication.acquireTokenSilentAsync(scopesValue.toLowerCase().split(" "), account.getAuthority(), getAuthSilentCallback(promise));
        } else {
            publicClientApplication.acquireTokenSilentAsync(DEFAULT_SCOPES, account.getAuthority(), getAuthSilentCallback(promise));
        }
    }

    /**
     * getAuthSilentCallback is the callback function for acquireTokenSlient.
     * If successful, it will return a map of the IAuthenticationResult.
     * If there's an error, the exception will be returned.
     */

    private SilentAuthenticationCallback getAuthSilentCallback(final Promise promise) {
        return new SilentAuthenticationCallback() {
            @Override
            public void onSuccess(IAuthenticationResult authenticationResult) {
                Log.d(TAG, "Acquire token silently success.");
                promise.resolve(mapMSALResult(authenticationResult));
            }

            @Override
            public void onError(MsalException exception) {
                Log.d(TAG, "Error while acquiring token silently: " + exception.toString());
                promise.reject(exception);
            }
        };
    }

    /**
    * Helper functions:
    * mapMSALResult(IAuthenticationResult result): used to convert AuthenticationResult into a map
    * so that it can be passed through a promise on the JS side
    * */

    private WritableNativeMap mapMSALResult (IAuthenticationResult result) {
        WritableNativeMap map = new WritableNativeMap();
        //add attributes from account
        map.putMap(KEY_ACCOUNT, mapAccount(result.getAccount()));
        //add attributes from result
        map.putString(KEY_ACCESS_TOKEN, result.getAccessToken());
        map.putString(KEY_AUTHENTICATION_SCHEME, result.getAuthenticationScheme());
        map.putString(KEY_AUTHORIZATION_HEADER, result.getAuthorizationHeader());
        map.putString(KEY_EXPIRES_ON, result.getExpiresOn().toString());
        map.putString(KEY_SCOPE, Arrays.toString(result.getScope()));
        map.putString(KEY_TENANT_ID, result.getTenantId());
        return map;
    }

    /**
     * Helper functions:
     * mapAccount(): used to convert IAccount into a map
     * so that it can be passed through a promise on the JS side
     * */

    private WritableNativeMap mapAccount (IAccount account) {
        WritableNativeMap map = new WritableNativeMap();
        //add attributes from account
        map.putString(KEY_AUTHORITY, account.getAuthority());
        map.putString(KEY_ID, account.getId());
        map.putString(KEY_TENANT_ID, account.getTenantId());
        map.putString(KEY_USERNAME, account.getUsername());
        map.putString(KEY_ID_TOKEN, (String) account.getClaims().get("id_token"));

        return map;
    }
}
