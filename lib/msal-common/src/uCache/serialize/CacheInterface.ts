/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export type JSONContent = {
    accessTokens: Array<string>;
    idTokens: Array<string>;
    refreshTokens: Array<string>;
    accounts: Array<string>;
    appMetadata: Array<string>;
    ParsedJSON: any;
};

export class CacheInterface {

    /**
     * serialize the JSON blob
     * @param data
     */
    static serializeJSONBlob(data: string): string {
        return JSON.stringify(data);
    }

    /**
     * Parse the JSON blob in memory and deserialize the content
     * @param cachedJson
     */
    static deserializeJSONBlob(cachedJson?: any): JSONContent {
        let ParsedJSON = cachedJson ? cachedJson : {};

        // retrieve the current JSON file
        const accessTokens: Array<string> = ParsedJSON.AccessToken ? ParsedJSON.AccessToken : {};
        const idTokens: Array<string> = ParsedJSON.IdToken ? ParsedJSON.IdToken : {};
        const refreshTokens: Array<string> = ParsedJSON.RefreshToken ? ParsedJSON.RefreshToken : {};
        const accounts: Array<string> = ParsedJSON.Account ? ParsedJSON.Account : {};
        const appMetadata: Array<string> = ParsedJSON.AppMetadata ? ParsedJSON.AppMetadata : {};

        let jsonContent: JSONContent = { accessTokens, idTokens, refreshTokens, accounts, appMetadata, ParsedJSON };
        return jsonContent;
    }
}
