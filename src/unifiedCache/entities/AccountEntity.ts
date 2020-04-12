/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Separators, CacheAccountType } from "../../utils/Constants";
import { Authority } from "../../authority/Authority";
import { IdToken } from "../../account/IdToken";
import { ICrypto } from "../../crypto/ICrypto";
import { buildClientInfo } from "../../account/ClientInfo";
import { StringUtils } from "../../utils/StringUtils";

/**
 * Type that defines required and optional parameters for an Account field (based on universal cache schema implemented by all MSALs)
 */
export class AccountEntity {
    homeAccountId: string;
    environment: string;
    realm: string;
    localAccountId: string;
    username: string;
    authorityType: string;
    name?: string;
    clientInfo?: string;
    lastModificationTime?: string;
    lastModificationApp?: string;

    /**
     * Generate Account Cache Key as per the schema: <home_account_id>-<environment>-<realm*>
     */
    public generateAccountEntityKey(): string {
        const accountCacheKeyArray: Array<string> = [
            this.homeAccountId,
            this.environment,
            this.realm
        ];

        return accountCacheKeyArray.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Build Account cache from IdToken, clientInfo and authority/policy
     * @param clientInfo
     * @param authority
     * @param idToken
     * @param policy
     */
    static createAccount(clientInfo: string, authority: Authority, idToken: IdToken, policy: string, crypto: ICrypto): AccountEntity {
        let account: AccountEntity;

        account.authorityType = CacheAccountType.MSSTS_ACCOUNT_TYPE;
        account.clientInfo = clientInfo;
        // TBD: Clarify "policy" addition
        const clientInfoObj = buildClientInfo(clientInfo, crypto);
        const homeAccountId = `${clientInfoObj.uid}${Separators.CLIENT_INFO_SEPARATOR}${clientInfoObj.utid}`;
        account.homeAccountId =
            policy !== null
                ? homeAccountId + Separators.CACHE_KEY_SEPARATOR + policy
                : homeAccountId;
        account.environment =
            authority.canonicalAuthorityUrlComponents.HostNameAndPort;
        account.realm = authority.tenant;

        if (idToken) {
            // How do you account for MSA CID here?
            const localAccountId = !StringUtils.isEmpty(idToken.claims.oid)
                ? idToken.claims.oid
                : idToken.claims.sid;
            account.localAccountId = localAccountId;
            account.username = idToken.claims.preferred_username;
            account.name = idToken.claims.name;
        }

        return account;
    }

    /**
     * Build ADFS account type
     * @param authority
     * @param idToken
     */
    static createADFSAccount(authority: Authority, idToken: IdToken): AccountEntity {
        let account: AccountEntity;

        account.authorityType = CacheAccountType.ADFS_ACCOUNT_TYPE;
        account.homeAccountId = idToken.claims.sub;
        account.environment =
            authority.canonicalAuthorityUrlComponents.HostNameAndPort;
        account.username = idToken.claims.upn;
        // add uniqueName to claims
        // account.name = idToken.claims.uniqueName;

        return account;
    }
}
