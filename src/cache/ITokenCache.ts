import { SilentRequest } from "../request/SilentRequest";
import { LoadTokenOptions } from "./TokenCache";

export interface ITokenCache {

    /** API to side-load tokens to MSAL cache */
    loadTokens(request: SilentRequest, idToken: string, options: LoadTokenOptions): void;
}
