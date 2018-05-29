import {LogLevel} from "msal";
import {ILoggerCallback} from "msal/lib-commonjs/Logger";

export class MsalConfig {
    clientID: string;
    authority ?= "https://login.microsoftonline.com/common";
    tokenReceivedCallback?: boolean;
    validateAuthority ? = true;
    cacheLocation? = "sessionStorage";
    redirectUri?: string;
    postLogoutRedirectUri?: string;
    logger?: ILoggerCallback;
    loadFrameTimeout? = 6000;
    navigateToLoginRequestUrl?= true ;
    popUp?: boolean;
    scopes?: string[];
    isAngular?:true;
    anonymousEndpoints? :  string[];
    endpoints?: Map<string, Array<string>>;
    extraQueryParameters?: string;
    correlationId?: string;
    level?: LogLevel;
    piiLoggingEnabled?: boolean;

}


