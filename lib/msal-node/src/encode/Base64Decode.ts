/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export class Base64Decode {
    /**
     * 'utf8': Multibyte encoded Unicode characters. Many web pages and other document formats use UTF-8.
     * 'base64': Base64 encoding.
     *
     * @param base64Str Base64 encoded text
     */
    static decode(base64Str: string): string {
        return Buffer.from(base64Str, 'base64').toString('utf8');
    }

    /**
     * @param base64Str Base64 encoded Url
     */
    static decodeUrl(base64Str: string): string {
        let str = base64Str.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) {
            str += '=';
        }
        return Base64Decode.decode(str);
    }
}
