/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ClientInfo } from "./ClientInfo";
import { IdToken } from "./IdToken";
import { CryptoUtils } from "../utils/CryptoUtils";
import { StringUtils } from "../utils/StringUtils";
import { StringDict } from "../app/MsalTypes";
import { ICrypto } from "../utils/crypto/ICrypto";

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
    idToken: StringDict; // will be deprecated soon
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
    constructor(accountIdentifier: string, homeAccountIdentifier: string, userName: string, name: string, idTokenClaims: StringDict, sid: string,  environment: string) {
        this.accountIdentifier = accountIdentifier;
        this.homeAccountIdentifier = homeAccountIdentifier;
        this.userName = userName;
        this.name = name;
        // will be deprecated soon
        this.idToken = idTokenClaims;
        this.idTokenClaims = idTokenClaims;
        this.sid = sid;
        this.environment = environment;
    }

    /**
     * @hidden
     * @param idToken
     * @param clientInfo
     */
    static createAccount(idToken: IdToken, clientInfo: ClientInfo, crypto: ICrypto): MsalAccount {

        // create accountIdentifier
        const accountIdentifier: string = idToken.objectId ||  idToken.subject;

        // create homeAccountIdentifier
        const uid: string = clientInfo ? clientInfo.uid : "";
        const utid: string = clientInfo ? clientInfo.utid : "";

        let homeAccountIdentifier: string;
        if (!StringUtils.isEmpty(uid) && !StringUtils.isEmpty(utid)) {
            homeAccountIdentifier = crypto.base64Encode(uid) + "." + crypto.base64Encode(utid);
        }
        return new MsalAccount(accountIdentifier, homeAccountIdentifier, idToken.preferredName, idToken.name, idToken.claims, idToken.sid, idToken.issuer);
    }

    /**
     * Utils function to compare two Account objects - used to check if the same user account is logged in
     *
     * @param a1: Account object
     * @param a2: Account object
     */
    static compareAccounts(a1: MsalAccount, a2: MsalAccount): boolean {
        if (!a1 || !a2) {
            return false;
        }
        if (a1.homeAccountIdentifier && a2.homeAccountIdentifier) {
            if (a1.homeAccountIdentifier === a2.homeAccountIdentifier) {
                return true;
            }
        }
        return false;
    }
}
