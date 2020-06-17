// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
/**
 * MSALModule.java functions as a wrapper around MSAL for Android's signing in, signing out, and acquiring tokens functionality.
 * It is a proof of concept, focusing on single account mode and AAD.
 */

package com.sampleapp;

import android.util.Log;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

import com.facebook.react.bridge.WritableNativeMap;
import com.microsoft.identity.client.*;
import com.microsoft.identity.client.exception.MsalException;


import static com.facebook.react.views.textinput.ReactTextInputManager.TAG;

public class MSALModule extends ReactContextBaseJavaModule {

    private final ReactApplicationContext reactContext;
    private ISingleAccountPublicClientApplication publicClientApplication;
    private IAccount mAccount;

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
        return "MSAL";
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
            //using the code, message parameters; will change code in future when we know what that is
            promise.reject("scopescode", "Scopes is empty.");
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
                mAccount = authenticationResult.getAccount();
                promise.resolve(mapMSALResult(authenticationResult));
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
     * Parameters: Promise promise (resolve will return the account as a map if it exists; reject will return null for nonexistent map or error)
     */
    @ReactMethod
    public void getAccount(Promise promise) {
        //first load account and get status string
        String message = loadAccount();
        if (mAccount == null) {
            promise.reject("loadaccountnull", message);
        } else {
            promise.resolve(mapAccount(mAccount));
        }
    }

    /**
     * loadAccount(): will load a currently signed in account. Called in constructor.
     * Returns a String with a message of the status (possibly an exception)
     */

    private String loadAccount() {
        if (publicClientApplication == null) {
            return "publicClientApplication is null";
        }
        String message = "";
        try {
            ICurrentAccountResult result = publicClientApplication.getCurrentAccount();
            IAccount currAccount = result.getCurrentAccount();
            if (currAccount == null) {
                message = "No account currently signed in";
            } else {
                mAccount = currAccount;
                message = "Retrieved signed in account";
            }
        } catch (Exception e) {
            message = "Error while loading account: " + e.toString();
            Log.d(TAG, message);
        }
        return message;
    }

    /**
    * Helper functions:
    * mapMSALResult(IAuthenticationResult result): used to convert AuthenticationResult into a map
    * so that it can be passed through a promise on the JS side
    * */

    private WritableNativeMap mapMSALResult (IAuthenticationResult result) {
        WritableNativeMap map = new WritableNativeMap();
        //add attributes from account
        map.putMap("account", mapAccount(result.getAccount()));
        //add attributes from result
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
        map.putString("authority", account.getAuthority());
        map.putString("accountId", account.getId());
        map.putString("tenantId", account.getTenantId());
        map.putString("username", account.getUsername());
        map.putString("idToken", (String) account.getClaims().get("id_token"));

        return map;
    }
}
