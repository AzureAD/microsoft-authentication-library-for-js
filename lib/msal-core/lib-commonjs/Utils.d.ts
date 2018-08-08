/**
 * Copyright (c) Microsoft Corporation
 *  All Rights Reserved
 *  MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this
 * software and associated documentation files (the 'Software'), to deal in the Software
 * without restriction, including without limitation the rights to use, copy, modify,
 * merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS
 * OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT
 * OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
import { IUri } from "./IUri";
import { User } from "./User";
export declare class Utils {
    static compareObjects(u1: User, u2: User): boolean;
    static expiresIn(expires: string): number;
    static now(): number;
    static isEmpty(str: string): boolean;
    static extractIdToken(encodedIdToken: string): any;
    static base64EncodeStringUrlSafe(input: string): string;
    static base64DecodeStringUrlSafe(base64IdToken: string): string;
    static encode(input: string): string;
    static utf8Encode(input: string): string;
    static decode(base64IdToken: string): string;
    static decodeJwt(jwtToken: string): any;
    static deserialize(query: string): any;
    static isIntersectingScopes(cachedScopes: Array<string>, scopes: Array<string>): boolean;
    static containsScope(cachedScopes: Array<string>, scopes: Array<string>): boolean;
    static convertToLowerCase(scopes: Array<string>): Array<string>;
    static removeElement(scopes: Array<string>, scope: string): Array<string>;
    static decimalToHex(num: number): string;
    static getLibraryVersion(): string;
    static replaceFirstPath(href: string, tenantId: string): string;
    static createNewGuid(): string;
    static GetUrlComponents(url: string): IUri;
    static CanonicalizeUri(url: string): string;
    static endsWith(url: string, suffix: string): boolean;
}
