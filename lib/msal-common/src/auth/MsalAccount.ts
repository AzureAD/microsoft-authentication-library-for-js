/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientInfo } from "./ClientInfo";
import { IdToken } from "./IdToken";
import { StringUtils } from "../utils/StringUtils";
import { StringDict } from "../utils/MsalTypes";
import { ICrypto } from "../utils/crypto/ICrypto";
import { IdTokenClaims } from "./IdTokenClaims";

/**
 * accountIdentifier       combination of idToken.uid and idToken.utid
 * homeAccountIdentifier   combination of clientInfo.uid and clientInfo.utid
 * userName                idToken.preferred_username
 * name                    idToken.name
 * idToken                 idToken
 * sid                     idToken.sid - session identifier
 * environment             idtoken.issuer (the authority that issues the token)
 */
export class MsalAccount {

    accountIdentifier: string;
    homeAccountIdentifier: string;
    userName: string;
    name: string;
    idToken: string;
    idTokenClaims: StringDict;
    sid: string;
    environment: string;

    /**
     * Creates an Account Object
     * @praram accountIdentifier
     * @param homeAccountIdentifier
     * @param userName
     * @param name
     * @param idToken
     * @param sid
     * @param environment
     */
    constructor(accountIdentifier: string, homeAccountIdentifier: string, idTokenClaims: IdTokenClaims, rawIdToken: string) {
        this.accountIdentifier = accountIdentifier;
        this.homeAccountIdentifier = homeAccountIdentifier;
        this.userName = idTokenClaims.preferred_username;
        this.name = idTokenClaims.name;
        // will be deprecated soon
        this.idToken = rawIdToken;
        this.idTokenClaims = idTokenClaims;
        this.sid = idTokenClaims.sid;
        this.environment = idTokenClaims.iss;
    }

    /**
     * @hidden
     * @param idToken
     * @param clientInfo
     */
    static createAccount(idToken: IdToken, clientInfo: ClientInfo, crypto: ICrypto): MsalAccount {

        // create accountIdentifier
        const accountIdentifier: string = idToken.claims.oid ||  idToken.claims.sub;

        // create homeAccountIdentifier
        const uid: string = clientInfo ? clientInfo.uid : "";
        const utid: string = clientInfo ? clientInfo.utid : "";

        let homeAccountIdentifier: string;
        if (!StringUtils.isEmpty(uid) && !StringUtils.isEmpty(utid)) {
            homeAccountIdentifier = crypto.base64Encode(uid) + "." + crypto.base64Encode(utid);
        }
        return new MsalAccount(accountIdentifier, homeAccountIdentifier, idToken.claims, idToken.rawIdToken);
    }

    /**
     * Utils function to compare two Account objects - used to check if the same user account is logged in
     *
     * @param a1: Account object
     * @param a2: Account object
     */
    static compareAccounts(a1: MsalAccount, a2: MsalAccount): boolean {
        if (!(a1 && a1.homeAccountIdentifier) || !(a2 && a2.homeAccountIdentifier)) {
            return false;
        }
        return a1.homeAccountIdentifier === a2.homeAccountIdentifier;
    }
}
