/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import {
    Separators,
    CacheAccountType,
    CacheType,
    Constants,
} from "../../utils/Constants";
import { Authority } from "../../authority/Authority";
import { AuthToken } from "../../account/AuthToken";
import { ICrypto } from "../../crypto/ICrypto";
import { buildClientInfo } from "../../account/ClientInfo";
import { StringUtils } from "../../utils/StringUtils";
import { AccountInfo } from "../../account/AccountInfo";
import { ClientAuthError } from "../../error/ClientAuthError";
import { AuthorityType } from "../../authority/AuthorityType";
import { Logger } from "../../logger/Logger";
import { TokenClaims } from "../../account/TokenClaims";

/**
 * Type that defines required and optional parameters for an Account field (based on universal cache schema implemented by all MSALs).
 *
 * Key : Value Schema
 *
 * Key: <home_account_id>-<environment>-<realm*>
 *
 * Value Schema:
 * {
 *      homeAccountId: home account identifier for the auth scheme,
 *      environment: entity that issued the token, represented as a full host
 *      realm: Full tenant or organizational identifier that the account belongs to
 *      localAccountId: Original tenant-specific accountID, usually used for legacy cases
 *      username: primary username that represents the user, usually corresponds to preferred_username in the v2 endpt
 *      authorityType: Accounts authority type as a string
 *      name: Full name for the account, including given name and family name,
 *      clientInfo: Full base64 encoded client info received from ESTS
 *      lastModificationTime: last time this entity was modified in the cache
 *      lastModificationApp:
 *      oboAssertion: access token passed in as part of OBO request
 *      idTokenClaims: Object containing claims parsed from ID token
 * }
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
    oboAssertion?: string;
    cloudGraphHostName?: string;
    msGraphHost?: string; 
    idTokenClaims?: TokenClaims;

    /**
     * Generate Account Id key component as per the schema: <home_account_id>-<environment>
     */
    generateAccountId(): string {
        const accountId: Array<string> = [this.homeAccountId, this.environment];
        return accountId.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Generate Account Cache Key as per the schema: <home_account_id>-<environment>-<realm*>
     */
    generateAccountKey(): string {
        return AccountEntity.generateAccountCacheKey({
            homeAccountId: this.homeAccountId,
            environment: this.environment,
            tenantId: this.realm,
            username: this.username,
            localAccountId: this.localAccountId
        });
    }

    /**
     * returns the type of the cache (in this case account)
     */
    generateType(): number {
        switch (this.authorityType) {
            case CacheAccountType.ADFS_ACCOUNT_TYPE:
                return CacheType.ADFS;
            case CacheAccountType.MSAV1_ACCOUNT_TYPE:
                return CacheType.MSA;
            case CacheAccountType.MSSTS_ACCOUNT_TYPE:
                return CacheType.MSSTS;
            case CacheAccountType.GENERIC_ACCOUNT_TYPE:
                return CacheType.GENERIC;
            default: {
                throw ClientAuthError.createUnexpectedAccountTypeError();
            }
        }
    }

    /**
     * Returns the AccountInfo interface for this account.
     */
    getAccountInfo(): AccountInfo {
        return {
            homeAccountId: this.homeAccountId,
            environment: this.environment,
            tenantId: this.realm,
            username: this.username,
            localAccountId: this.localAccountId,
            name: this.name,
            idTokenClaims: this.idTokenClaims
        };
    }

    /**
     * Generates account key from interface
     * @param accountInterface
     */
    static generateAccountCacheKey(accountInterface: AccountInfo): string {
        const accountKey = [
            accountInterface.homeAccountId,
            accountInterface.environment || "",
            accountInterface.tenantId || "",
        ];

        return accountKey.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Build Account cache from IdToken, clientInfo and authority/policy. Associated with AAD.
     * @param clientInfo
     * @param authority
     * @param idToken
     * @param policy
     */
    static createAccount(
        clientInfo: string,
        homeAccountId: string,
        authority: Authority,
        idToken: AuthToken,
        oboAssertion?: string,
        cloudGraphHostName?: string,
        msGraphHost?: string
    ): AccountEntity {
        const account: AccountEntity = new AccountEntity();

        account.authorityType = CacheAccountType.MSSTS_ACCOUNT_TYPE;
        account.clientInfo = clientInfo;
        account.homeAccountId = homeAccountId;

        const env = authority.getPreferredCache();
        if (StringUtils.isEmpty(env)) {
            throw ClientAuthError.createInvalidCacheEnvironmentError();
        }

        account.environment = env;
        // non AAD scenarios can have empty realm
        account.realm = idToken?.claims?.tid || "";
        account.oboAssertion = oboAssertion;
        
        if (idToken) {
            account.idTokenClaims = idToken.claims;

            // How do you account for MSA CID here?
            account.localAccountId = idToken?.claims?.oid || idToken?.claims?.sub || "";

            /*
             * In B2C scenarios the emails claim is used instead of preferred_username and it is an array. In most cases it will contain a single email.
             * This field should not be relied upon if a custom policy is configured to return more than 1 email.
             */
            account.username = idToken?.claims?.preferred_username || (idToken?.claims?.emails? idToken.claims.emails[0]: "");
            account.name = idToken?.claims?.name;
        }

        account.cloudGraphHostName = cloudGraphHostName;
        account.msGraphHost = msGraphHost;

        return account;
    }

    /**
     * Builds non-AAD/ADFS account.
     * @param authority
     * @param idToken
     */
    static createGenericAccount(
        authority: Authority,
        homeAccountId: string,
        idToken: AuthToken,
        oboAssertion?: string,
        cloudGraphHostName?: string,
        msGraphHost?: string
    ): AccountEntity {
        const account: AccountEntity = new AccountEntity();

        account.authorityType = (authority.authorityType === AuthorityType.Adfs) ? CacheAccountType.ADFS_ACCOUNT_TYPE : CacheAccountType.GENERIC_ACCOUNT_TYPE;
        account.homeAccountId = homeAccountId;
        // non AAD scenarios can have empty realm
        account.realm = "";
        account.oboAssertion = oboAssertion;

        const env = authority.getPreferredCache();

        if (StringUtils.isEmpty(env)) {
            throw ClientAuthError.createInvalidCacheEnvironmentError();
        }

        if (idToken) {
            // How do you account for MSA CID here?
            account.localAccountId = idToken?.claims?.oid || idToken?.claims?.sub || "";
            // upn claim for most ADFS scenarios
            account.username = idToken?.claims?.upn || "";
            account.name = idToken?.claims?.name || "";
            account.idTokenClaims = idToken?.claims;
        }

        account.environment = env;

        account.cloudGraphHostName = cloudGraphHostName;
        account.msGraphHost = msGraphHost;

        /*
         * add uniqueName to claims
         * account.name = idToken.claims.uniqueName;
         */

        return account;
    }

    /**
     * Generate HomeAccountId from server response
     * @param serverClientInfo
     * @param authType
     */
    static generateHomeAccountId(serverClientInfo: string, authType: AuthorityType, logger: Logger, cryptoObj: ICrypto, idToken?: AuthToken): string {

        const accountId = idToken?.claims?.sub ? idToken.claims.sub : Constants.EMPTY_STRING;

        // since ADFS does not have tid and does not set client_info
        if (authType === AuthorityType.Adfs) {
            return accountId;
        }

        // for cases where there is clientInfo
        if (serverClientInfo) {
            const clientInfo = buildClientInfo(serverClientInfo, cryptoObj);
            if (!StringUtils.isEmpty(clientInfo.uid) && !StringUtils.isEmpty(clientInfo.utid)) {
                return `${clientInfo.uid}${Separators.CLIENT_INFO_SEPARATOR}${clientInfo.utid}`;
            }
        }

        // default to "sub" claim
        logger.verbose("No client info in response");
        return accountId;
    }

    /**
     * Validates an entity: checks for all expected params
     * @param entity
     */
    static isAccountEntity(entity: object): boolean {

        if (!entity) {
            return false;
        }

        return (
            entity.hasOwnProperty("homeAccountId") &&
            entity.hasOwnProperty("environment") &&
            entity.hasOwnProperty("realm") &&
            entity.hasOwnProperty("localAccountId") &&
            entity.hasOwnProperty("username") &&
            entity.hasOwnProperty("authorityType")
        );
    }

    /**
     * Helper function to determine whether 2 accountInfo objects represent the same account
     * @param accountA 
     * @param accountB 
     * @param compareClaims - If set to true idTokenClaims will also be compared to determine account equality
     */
    static accountInfoIsEqual(accountA: AccountInfo | null, accountB: AccountInfo | null, compareClaims?: boolean): boolean {
        if (!accountA || !accountB) {
            return false;
        }

        let claimsMatch = true; // default to true so as to not fail comparison below if compareClaims: false
        if (compareClaims) {
            const accountAClaims = (accountA.idTokenClaims || {}) as TokenClaims;
            const accountBClaims = (accountB.idTokenClaims || {}) as TokenClaims;

            // issued at timestamp and nonce are expected to change each time a new id token is acquired
            claimsMatch = (accountAClaims.iat === accountBClaims.iat) &&
            (accountAClaims.nonce === accountBClaims.nonce);
        }

        return (accountA.homeAccountId === accountB.homeAccountId) && 
            (accountA.localAccountId === accountB.localAccountId) &&
            (accountA.username === accountB.username) &&
            (accountA.tenantId === accountB.tenantId) &&
            (accountA.environment === accountB.environment) &&
            claimsMatch;
    }
}
