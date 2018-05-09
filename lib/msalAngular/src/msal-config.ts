import {Logger} from "../../msal-core/lib-commonjs/Logger";

export class MsalConfig {
    clientID: string;
    authority ?= "https://login.microsoftonline.com/common";
    tokenReceivedCallback?: boolean;
    validateAuthority ? = true;
    cacheLocation? = "sessionStorage";
    redirectUri?: string;
    postLogoutRedirectUri?: string;
    logger?: Logger;
    loadFrameTimeout? = 6000;
    navigateToLoginRequestUrl?= true ;
    popUp?: boolean;
    scopes?: string[];
    isAngular?:true;
    anonymousEndpoints? :  string[];
    endpoints?: Map<string, Array<string>>;
    extraQueryParameters?: string;

}


