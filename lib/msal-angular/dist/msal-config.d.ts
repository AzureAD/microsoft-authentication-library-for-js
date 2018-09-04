import { LogLevel } from "msal";
import { ILoggerCallback } from "msal/lib-commonjs/Logger";
export declare class MsalConfig {
    clientID: string;
    authority?: string;
    tokenReceivedCallback?: boolean;
    validateAuthority?: boolean;
    cacheLocation?: string;
    redirectUri?: string;
    postLogoutRedirectUri?: string;
    logger?: ILoggerCallback;
    loadFrameTimeout?: number;
    navigateToLoginRequestUrl?: boolean;
    popUp?: boolean;
    consentScopes?: string[];
    isAngular?: true;
    unprotectedResources?: string[];
    protectedResourceMap?: [string, string[]][];
    extraQueryParameters?: string;
    correlationId?: string;
    level?: LogLevel;
    piiLoggingEnabled?: boolean;
}
