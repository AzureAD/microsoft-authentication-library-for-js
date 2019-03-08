import { User } from "./User";

/**
 * we considered making this "enum" in the request instead of string, however it looks like the allowed list of
 * prompt values kept changing over past couple of years. There are some undocumented prompt values for some
 * internal partners too, hence the choice of generic "string" type instead of the "enum"
 * @hidden
 */
export enum promptState {
	login = "login",
	select_account = "select_account",
	consent = "consent",
	none = "none",
}


export type AuthenticationParameters = {
    scopes?: Array<string>;
    extraScopesToConsent?: Array<string>;
    prompt?: string;
    extraQueryParameters?: {[header: string]: string};
    claimsRequest?: null;
    authority?: string;
    correlationId?: string;
    account?: User;
    sid?: string;
    loginHint?: string;
};
