import {LogLevel} from "msal";
import {ILoggerCallback} from "msal/lib-commonjs/Logger";

export class MsalConfig {
    clientID: string;
    authority ?= "https://login.microsoftonline.com/common";
    tokenReceivedCallback?: boolean;
    validateAuthority ? = true;
    cacheLocation? = "sessionStorage";
    storeAuthStateInCookie? = false;
    redirectUri?: string;
    postLogoutRedirectUri?: string;
    logger?: ILoggerCallback;
    loadFrameTimeout? = 6000;
    navigateToLoginRequestUrl?= true ;
    popUp?: boolean;
    consentScopes?: string[];
    isAngular?:true;
    unprotectedResources? :  string[];
    protectedResourceMap?: [string, string[]][];
    extraQueryParameters?: string;
    correlationId?: string;
    level?: LogLevel;
    piiLoggingEnabled?: boolean;

}


