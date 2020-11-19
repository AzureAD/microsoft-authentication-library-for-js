//Constants class which will be imported by MSALModule
package com.reactlibrary;

public final class Constants {

    private Constants() {}

    public static final String[] DEFAULT_SCOPES = {"User.Read"};

    public static final String MODULE_NAME = "MSAL";

    public static final String KEY_ACCOUNT = "account";
    public static final String KEY_ACCESS_TOKEN = "accessToken";
    public static final String KEY_AUTHENTICATION_SCHEME = "authenticationScheme";
    public static final String KEY_AUTHORIZATION_HEADER = "authorizationHeader";
    public static final String KEY_EXPIRES_ON = "expiresOn";
    public static final String KEY_SCOPE = "scope";
    public static final String KEY_TENANT_ID = "tenantId";

    public static final String KEY_AUTHORITY = "authority";
    public static final String KEY_ID = "id";
    public static final String KEY_USERNAME = "username";
    public static final String KEY_ID_TOKEN = "idToken";
}