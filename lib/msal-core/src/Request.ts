import { User } from "./User";


/**
 * TODO:
 * prompt: We considered making this "enum" in the request instead of string, however it looks like the allowed
 * list of prompt values kept changing over past couple of years. There are some undocumented prompt values for some
 * internal partners too, hence the choice of generic "string" type instead of the "enum".
 *
 * claimsRequest: This will be a part of the feature "Conditional Access"
 *
 * correlationId: No code yet, need to support this as a part of logging sanity check asap
 *
 * account: Next PR on request will be user->account code changes
 *
 * THIS NOTE IS TEMPORARY FOR TRACTION
 */

/**
 *
 */
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
