/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Separators, CacheAccountType, Constants } from "../../utils/Constants";
import { Authority } from "../../authority/Authority";
import { ICrypto } from "../../crypto/ICrypto";
import { buildClientInfo } from "../../account/ClientInfo";
import { AccountInfo } from "../../account/AccountInfo";
import {
    createClientAuthError,
    ClientAuthErrorCodes,
} from "../../error/ClientAuthError";
import { AuthorityType } from "../../authority/AuthorityType";
import { Logger } from "../../logger/Logger";
import { TokenClaims } from "../../account/TokenClaims";
import { ProtocolMode } from "../../authority/ProtocolMode";

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
 *      lastModificationTime: last time this entity was modified in the cache
 *      lastModificationApp:
 *      idTokenClaims: Object containing claims parsed from ID token
 *      nativeAccountId: Account identifier on the native device
 * }
 * @internal
 */
export class AccountEntity {
    homeAccountId: string;
    environment: string;
    realm: string;
    localAccountId: string;
    username: string;
    authorityType: string;
    clientInfo?: string;
    name?: string;
    lastModificationTime?: string;
    lastModificationApp?: string;
    cloudGraphHostName?: string;
    msGraphHost?: string;
    idTokenClaims?: TokenClaims;
    nativeAccountId?: string;

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
            localAccountId: this.localAccountId,
        });
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
            idTokenClaims: this.idTokenClaims,
            nativeAccountId: this.nativeAccountId,
            authorityType: this.authorityType,
        };
    }

    /**
     * Generates account key from interface
     * @param accountInterface
     */
    static generateAccountCacheKey(accountInterface: AccountInfo): string {
        const accountKey = [
            accountInterface.homeAccountId,
            accountInterface.environment || Constants.EMPTY_STRING,
            accountInterface.tenantId || Constants.EMPTY_STRING,
        ];

        return accountKey.join(Separators.CACHE_KEY_SEPARATOR).toLowerCase();
    }

    /**
     * Build Account cache from IdToken, clientInfo and authority/policy. Associated with AAD.
     * @param accountDetails
     */
    static createAccount(
        accountDetails: {
            homeAccountId: string;
            idTokenClaims: TokenClaims;
            clientInfo?: string;
            cloudGraphHostName?: string;
            msGraphHost?: string;
            environment?: string;
            nativeAccountId?: string;
        },
        authority: Authority
    ): AccountEntity {
        const account: AccountEntity = new AccountEntity();

        if (authority.authorityType === AuthorityType.Adfs) {
            account.authorityType = CacheAccountType.ADFS_ACCOUNT_TYPE;
        } else if (authority.protocolMode === ProtocolMode.AAD) {
            account.authorityType = CacheAccountType.MSSTS_ACCOUNT_TYPE;
        } else {
            account.authorityType = CacheAccountType.GENERIC_ACCOUNT_TYPE;
        }

        account.clientInfo = accountDetails.clientInfo;
        account.homeAccountId = accountDetails.homeAccountId;
        account.nativeAccountId = accountDetails.nativeAccountId;

        const env =
            accountDetails.environment ||
            (authority && authority.getPreferredCache());

        if (!env) {
            throw createClientAuthError(
                ClientAuthErrorCodes.invalidCacheEnvironment
            );
        }

        account.environment = env;
        // non AAD scenarios can have empty realm
        account.realm =
            accountDetails.idTokenClaims.tid || Constants.EMPTY_STRING;

        // How do you account for MSA CID here?
        account.localAccountId =
            accountDetails.idTokenClaims.oid ||
            accountDetails.idTokenClaims.sub ||
            Constants.EMPTY_STRING;

        /*
         * In B2C scenarios the emails claim is used instead of preferred_username and it is an array.
         * In most cases it will contain a single email. This field should not be relied upon if a custom
         * policy is configured to return more than 1 email.
         */
        const preferredUsername =
            accountDetails.idTokenClaims.preferred_username ||
            accountDetails.idTokenClaims.upn;
        const email = accountDetails.idTokenClaims.emails
            ? accountDetails.idTokenClaims.emails[0]
            : null;

        account.username = preferredUsername || email || Constants.EMPTY_STRING;
        account.name = accountDetails.idTokenClaims.name;

        account.cloudGraphHostName = accountDetails.cloudGraphHostName;
        account.msGraphHost = accountDetails.msGraphHost;

        return account;
    }

    /**
     * Creates an AccountEntity object from AccountInfo
     * @param accountInfo
     * @param cloudGraphHostName
     * @param msGraphHost
     * @returns
     */
    static createFromAccountInfo(
        accountInfo: AccountInfo,
        cloudGraphHostName?: string,
        msGraphHost?: string
    ): AccountEntity {
        const account: AccountEntity = new AccountEntity();

        account.authorityType =
            accountInfo.authorityType || CacheAccountType.GENERIC_ACCOUNT_TYPE;
        account.homeAccountId = accountInfo.homeAccountId;
        account.localAccountId = accountInfo.localAccountId;
        account.nativeAccountId = accountInfo.nativeAccountId;

        account.realm = accountInfo.tenantId;
        account.environment = accountInfo.environment;

        account.username = accountInfo.username;
        account.name = accountInfo.name;

        account.cloudGraphHostName = cloudGraphHostName;
        account.msGraphHost = msGraphHost;

        return account;
    }

    /**
     * Generate HomeAccountId from server response
     * @param serverClientInfo
     * @param authType
     */
    static generateHomeAccountId(
        serverClientInfo: string,
        authType: AuthorityType,
        logger: Logger,
        cryptoObj: ICrypto,
        idTokenClaims?: TokenClaims
    ): string {
        const accountId = idTokenClaims?.sub
            ? idTokenClaims.sub
            : Constants.EMPTY_STRING;

        // since ADFS does not have tid and does not set client_info
        if (
            authType === AuthorityType.Adfs ||
            authType === AuthorityType.Dsts
        ) {
            return accountId;
        }

        // for cases where there is clientInfo
        if (serverClientInfo) {
            try {
                const clientInfo = buildClientInfo(serverClientInfo, cryptoObj);
                if (clientInfo.uid && clientInfo.utid) {
                    return `${clientInfo.uid}${Separators.CLIENT_INFO_SEPARATOR}${clientInfo.utid}`;
                }
            } catch (e) {}
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
    static accountInfoIsEqual(
        accountA: AccountInfo | null,
        accountB: AccountInfo | null,
        compareClaims?: boolean
    ): boolean {
        if (!accountA || !accountB) {
            return false;
        }

        let claimsMatch = true; // default to true so as to not fail comparison below if compareClaims: false
        if (compareClaims) {
            const accountAClaims = (accountA.idTokenClaims ||
                {}) as TokenClaims;
            const accountBClaims = (accountB.idTokenClaims ||
                {}) as TokenClaims;

            // issued at timestamp and nonce are expected to change each time a new id token is acquired
            claimsMatch =
                accountAClaims.iat === accountBClaims.iat &&
                accountAClaims.nonce === accountBClaims.nonce;
        }

        return (
            accountA.homeAccountId === accountB.homeAccountId &&
            accountA.localAccountId === accountB.localAccountId &&
            accountA.username === accountB.username &&
            accountA.tenantId === accountB.tenantId &&
            accountA.environment === accountB.environment &&
            accountA.nativeAccountId === accountB.nativeAccountId &&
            claimsMatch
        );
    }
}
