import { User } from "./User";
import { IdToken } from "./IdToken";

// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

export class AuthResponse  {
    private uniqueId: string;
    private tenantId: string;
    private tokenType: string;
    private idToken: IdToken;
    private accessToken: object;
    private scopes: Array<string>;
    private expiresIn: string;
    private account: User;
    private userState: string;

    constructor() {
        this.uniqueId = "";
        this.tenantId = "";
        this.tokenType = "";
        this.idToken = null;
        this.accessToken = null;
        this.scopes = null;
        this.expiresIn = "";
        this.account = null;
        this.userState = "";
    }

    public getUniqueId() {
        return this.uniqueId;
    }

    public setUniqueId(inUniqueId: string) : void {
        this.uniqueId = inUniqueId;
    }

    public getTenantId() : string {
        return this.tenantId;
    }

    public setTenantId(inTenantId: string) : void {
        this.tenantId = inTenantId;
    }

    public getTokenType() : string {
        return this.tokenType;
    }

    public setTokenType(inTokenType: string) : void {
        this.tokenType = inTokenType;
    }

    public getIdToken() : IdToken {
        return this.idToken;
    }

    public setIdToken(inIdToken: IdToken) : void {
        this.idToken = inIdToken;
    }

    public getAccessToken() : object {
        return this.accessToken;
    }

    public setAccessToken(inAccessToken: object) : void {
        this.accessToken = inAccessToken;
    }

    public getScopes() : Array<string> {
        return this.scopes;
    }

    public setScopes(inScopes: Array<string>) : void {
        this.scopes = inScopes;
    }

    public getExpiresIn() : string {
        return this.expiresIn;
    }

    public setExpiresIn(inExpiresIn: string) : void {
        this.expiresIn = inExpiresIn;
    }

    public getAccount() : User {
        return this.account;
    }

    public setAccount(inAccount: User) : void {
        this.account = inAccount;
    }

    public getUserState() : string {
        return this.userState;
    }

    public setUserState(inUserState: string) : void {
        this.userState = inUserState;
    }
}
